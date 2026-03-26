import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const GOOGLE_SCOPES =
  'openid email profile https://www.googleapis.com/auth/calendar';

export { GOOGLE_SCOPES };

// ─── Auth Config Validation (run at module load, non-fatal) ─────────────────
function validateAuthConfig(): void {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[Auth] Missing environment variables (will cause auth failures at runtime):\n` +
        missing.map((v) => `  - ${v}`).join('\n')
    );
  } else {
    console.debug('[Auth] All required environment variables are present.');
  }
}

validateAuthConfig();

// ─── Debug helper ─────────────────────────────────────────────────────────────
function debugAuth(label: string, data?: Record<string, unknown>): void {
  if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
    console.debug(`[Auth] ${label}`, data ?? '');
  }
}

export const authOptions: NextAuthOptions = {
  // trustHost: true - Set via NEXTAUTH_TRUST_HOST=true environment variable in Vercel
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'MISSING_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'MISSING_GOOGLE_CLIENT_SECRET',
      authorization: { params: { scope: GOOGLE_SCOPES, access_type: 'offline', prompt: 'consent' } },
      // PKCE temporarily disabled for debugging
      checks: [],
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email/Usuario', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.info('[Auth] signIn callback', {
        hasUser: !!user,
        userEmail: user?.email,
        hasAccount: !!account,
        accountProvider: account?.provider,
      });

      // Always allow OAuth sign-ins
      return true;
    },
    async jwt({ token, user, account, isNewUser }) {
      console.info('[Auth] jwt callback START', {
        hasAccount: !!account,
        accountType: account?.type,
        accountProvider: account?.provider,
        hasUser: !!user,
        isNewUser,
        hasTokenId: !!token?.id,
        userId: user?.id,
        tokenSub: token?.sub,
      });

      try {
        // For OAuth sign-in, set token.id from user.id
        if (user?.id) {
          console.info('[Auth] jwt: setting token.id from user.id =', user.id);
          token.id = user.id;
        } else if (token?.sub) {
          console.info('[Auth] jwt: setting token.id from token.sub =', token.sub);
          token.id = token.sub;
        } else {
          console.warn('[Auth] jwt: no user.id or token.sub available');
        }

        console.info('[Auth] jwt callback END, returning token');
        return token;
      } catch (err) {
        console.error('[Auth] jwt callback error:', err);
        throw err;
      }
    },
    async session({ session, token }) {
      console.info('[Auth] session callback START', {
        hasToken: !!token,
        hasSessionUser: !!session.user,
        tokenId: token?.id ? '[REDACTED]' : undefined,
      });

      try {
        if (token?.id && session.user) {
          session.user.id = token.id as string;
          console.info('[Auth] session callback: set session.user.id from token.id');
        } else {
          console.warn('[Auth] session callback: token.id or session.user is missing');
        }

        console.info('[Auth] session callback END');
        return session;
      } catch (err) {
        console.error('[Auth] session callback error:', err);
        throw err;
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        console.info(`[Auth] signIn: user=${user?.email ?? user?.id}, provider=${account?.provider}`);
      } catch (err) {
        console.error('[Auth] signIn event error:', err);
      }
    },
    async signOut({ session }) {
      try {
        console.info(`[Auth] signOut: userId=${session?.user?.id}`);
      } catch (err) {
        console.error('[Auth] signOut event error:', err);
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
