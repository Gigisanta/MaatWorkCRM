import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

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

// ─── OAuth New User Onboarding ───────────────────────────────────────────────
// Creates Organization + Member + PipelineStages when a new Google user signs in
async function onboardNewOAuthUser(userId: string, email: string, name: string | null | undefined) {
  try {
    const baseSlug = (email || 'user').toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const orgSlug = `${baseSlug}-${uniqueSuffix}`;
    const orgName = name ? `${name}'s Organization` : 'My Organization';

    const organization = await db.organization.create({
      data: { name: orgName, slug: orgSlug },
    });

    await db.member.create({
      data: { userId, organizationId: organization.id, role: 'owner' },
    });

    const stageNames = [
      { name: 'Prospecto', color: '#8B5CF6', order: 0, isDefault: true, isActive: true, wipLimit: null },
      { name: 'Contactado', color: '#3B82F6', order: 1, isDefault: false, isActive: true, wipLimit: 10 },
      { name: 'Primera Reunión', color: '#F59E0B', order: 2, isDefault: false, isActive: true, wipLimit: 8 },
      { name: 'Segunda Reunión', color: '#10B981', order: 3, isDefault: false, isActive: true, wipLimit: 5 },
      { name: 'Apertura', color: '#6366F1', order: 4, isDefault: false, isActive: true, wipLimit: null },
      { name: 'Cliente', color: '#22C55E', order: 5, isDefault: false, isActive: true, wipLimit: null },
      { name: 'Caído', color: '#EF4444', order: 6, isDefault: false, isActive: true, wipLimit: null },
      { name: 'Cuenta Vacía', color: '#6B7280', order: 7, isDefault: false, isActive: true, wipLimit: null },
    ];

    await Promise.all(
      stageNames.map((stage) =>
        db.pipelineStage.create({
          data: { organizationId: organization.id, ...stage },
        })
      )
    );

    logger.info({ operation: 'onboardNewOAuthUser', userId, organizationId: organization.id }, 'OAuth user onboarded successfully');
  } catch (err) {
    logger.error({ err, operation: 'onboardNewOAuthUser', userId }, 'Failed to onboard OAuth user');
    // Don't throw - don't block auth flow if onboarding fails
  }
}

export const authOptions: NextAuthOptions = {
  // trustHost: true - Set via NEXTAUTH_TRUST_HOST=true environment variable in Vercel
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'MISSING_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'MISSING_GOOGLE_CLIENT_SECRET',
      authorization: { params: { scope: GOOGLE_SCOPES, access_type: 'offline', prompt: 'consent' } },
      // Use default NextAuth checks (state + PKCE)
      // checks: [],
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
    async signIn({ user, account, profile }) {
      logger.debug({ operation: 'signIn', userEmail: user?.email, accountProvider: account?.provider }, '[Auth] signIn callback');

      // Always allow OAuth sign-ins
      return true;
    },
    async jwt({ token, user, account, isNewUser }) {
      logger.debug({ operation: 'jwt', hasAccount: !!account, accountProvider: account?.provider, hasUser: !!user, isNewUser }, '[Auth] jwt callback START');

      try {
        // For OAuth sign-in, set token.id from user.id
        if (user?.id) {
          logger.debug({ operation: 'jwt', userId: user.id }, '[Auth] jwt: setting token.id from user.id');
          token.id = user.id;

          // Onboard new OAuth users: create org + member + pipeline stages
          // Await the onboarding so the JWT token includes the correct organizationId
          if (isNewUser && account?.provider === 'google' && user.email) {
            logger.debug({ operation: 'jwt', userId: user.id }, '[Auth] jwt: new Google user, starting onboarding');
            await onboardNewOAuthUser(user.id, user.email, user.name);
          }
        } else if (token?.sub) {
          logger.debug({ operation: 'jwt', tokenSub: token.sub }, '[Auth] jwt: setting token.id from token.sub');
          token.id = token.sub;
        } else {
          logger.warn({ operation: 'jwt' }, '[Auth] jwt: no user.id or token.sub available');
        }

        // Set organizationId in token for immediate availability after OAuth sign-in
        // (only if we have a user id to work with)
        if (token.id) {
          const userWithMembers = await db.user.findUnique({
            where: { id: token.id as string },
            include: {
              members: {
                take: 1,
                select: { organizationId: true },
              },
            },
          });
          if (userWithMembers) {
            token.organizationId = userWithMembers.members[0]?.organizationId || null;
          }
        }

        logger.debug({ operation: 'jwt' }, '[Auth] jwt callback END, returning token');
        return token;
      } catch (err) {
        logger.error({ err, operation: 'jwt' }, '[Auth] jwt callback error');
        throw err;
      }
    },
    async session({ session, token }) {
      logger.debug({ operation: 'session', hasToken: !!token, hasSessionUser: !!session.user }, '[Auth] session callback START');

      try {
        // With JWT strategy, token.id is set by jwt callback and copied here
        if (session.user && (token as any)?.id) {
          session.user.id = (token as any).id as string;
          logger.debug({ operation: 'session' }, '[Auth] session callback: set session.user.id from token.id');
        } else {
          logger.warn({ operation: 'session' }, '[Auth] session callback: token.id or session.user is missing');
        }

        // Propagate organizationId from token to session for immediate availability
        if ((token as any)?.organizationId) {
          (session.user as any).organizationId = (token as any).organizationId;
        }

        logger.debug({ operation: 'session' }, '[Auth] session callback END');
        return session;
      } catch (err) {
        logger.error({ err, operation: 'session' }, '[Auth] session callback error');
        throw err;
      }
    },
  },
  events: {
    async signIn({ user, account }) {
      try {
        logger.debug({ operation: 'signIn', userId: user?.id, provider: account?.provider }, `[Auth] signIn event`);
      } catch (err) {
        logger.error({ err, operation: 'signIn' }, '[Auth] signIn event error');
      }
    },
    async signOut({ session }) {
      try {
        logger.debug({ operation: 'signOut', userId: session?.user?.id }, `[Auth] signOut event`);
      } catch (err) {
        logger.error({ err, operation: 'signOut' }, '[Auth] signOut event error');
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
