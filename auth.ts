// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { getAuthEnv } from "@/lib/env";
import type { UserRole } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import { getDefaultRoleForEmail, resolveRoleForUser } from "@/lib/roles";
import { getServerSecret } from "@/lib/server-secrets";

const authEnv = getAuthEnv({ strict: false });
const googleConfigured = Boolean(authEnv.googleClientId && authEnv.googleClientSecret);
const authSecret =
  process.env.NODE_ENV === "production"
    ? getServerSecret("NEXTAUTH_SECRET", "hawklife-dev-secret")
    : authEnv.nextAuthSecret || getServerSecret("NEXTAUTH_SECRET", "hawklife-dev-secret");

function isAllowedEmail(email: string): boolean {
  return getDefaultRoleForEmail(email) !== null;
}

type AppToken = JWT & {
  role?: UserRole;
  userId?: string;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: googleConfigured
    ? [
        Google({
          clientId: authEnv.googleClientId!,
          clientSecret: authEnv.googleClientSecret!,
        }),
      ]
    : [],
  secret: authSecret,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!googleConfigured) {
        return "/auth/error?error=Configuration";
      }
      if (!user.email) return false;
      if (account?.provider === "google" && profile && "email_verified" in profile && profile.email_verified !== true) {
        return "/auth/error?error=AccessDenied";
      }
      if (!isAllowedEmail(user.email)) {
        return "/auth/error?error=DomainNotAllowed";
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      const appToken = token as AppToken;

      if (user?.email) {
        const existingUser = user.id
          ? await prisma.user.findUnique({
              where: { id: user.id },
              select: { role: true },
            }).catch(() => null)
          : null;
        const role = resolveRoleForUser(user.email, existingUser?.role);
        appToken.role = role ?? undefined;
        appToken.userId = user.id;
      }
      if (trigger === "update" && appToken.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: appToken.userId },
          select: { role: true },
        });
        if (dbUser) appToken.role = dbUser.role;
      }
      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as AppToken;

      if (session.user) {
        session.user.id = appToken.userId as string;
        session.user.role = appToken.role as UserRole;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return;
      const role = getDefaultRoleForEmail(user.email);
      if (role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role },
        }).catch(() => {});
      }
    },
    async signIn({ user }) {
      if (!user.id) return;
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      }).catch(() => null);
      const role = user.email
        ? resolveRoleForUser(user.email, existingUser?.role)
        : existingUser?.role;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastSeenAt: new Date(),
          ...(role ? { role } : {}),
        },
      }).catch(() => {});
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
