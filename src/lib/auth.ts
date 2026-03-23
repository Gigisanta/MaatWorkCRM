import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { calendarSyncEngine } from '@/lib/google-calendar/sync-engine';

const GOOGLE_SCOPES =
  'openid email profile https://www.googleapis.com/auth/calendar';

export { GOOGLE_SCOPES };

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { scope: GOOGLE_SCOPES } },
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        if (account.type === 'oauth') {
          // Encrypt and store OAuth tokens for Google
          token.googleAccessToken = encryptToken(account.access_token ?? '');
          token.googleRefreshToken = encryptToken(
            account.refresh_token ?? ''
          );
        }
      }

      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;

        // Fetch linked providers for the user — NO tokens exposed to client
        const accounts = await db.account.findMany({
          where: { userId: token.id as string },
          select: { providerId: true },
        });
        (session as any).linkedProviders = accounts.map((a) => a.providerId);
        // Tokens are stored encrypted in JWT (transport) and in db.account (persistence).
        // Calendar API reads directly from db.account via getUserTokens().
        // Client NEVER receives Google access/refresh tokens.
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Update email verified timestamp for Google sign ins
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });

        // Trigger initial calendar sync and webhook registration (non-blocking)
        const membership = await db.member.findFirst({
          where: { userId: user.id },
        });

        if (membership) {
          const orgId = membership.organizationId;

          // Register webhook first so we receive push notifications
          calendarSyncEngine.registerWebhook(user.id, 'primary').catch((err: Error) => {
            console.error('[Auth] Failed to register calendar webhook:', err.message);
          });

          // Initial full sync — fire-and-forget, doesn't block the sign-in
          calendarSyncEngine.initialSync(user.id, orgId, 'primary').catch((err: Error) => {
            console.error('[Auth] Initial calendar sync failed:', err.message);
          });
        }
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
