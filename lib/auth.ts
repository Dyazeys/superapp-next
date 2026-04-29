import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/db/prisma";
import { ROLE_PERMISSION_TEMPLATES } from "@/lib/rbac";
import { env } from "@/schemas/env";
import { verifyPassword } from "@/lib/password";

function buildPasswordCandidates(value: string) {
  const trimmed = value.trim();
  const noEscapedDollar = trimmed.replace(/\\\$/g, "$");
  const withEscapedDollar = trimmed.replace(/\$/g, "\\$");

  return new Set([trimmed, noEscapedDollar, withEscapedDollar]);
}

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([permission]) => permission);
  }

  return [];
}

async function authorizeDatabaseUser(login: string, password: string) {
  const dbUser = await prisma.users.findFirst({
    where: {
      username: {
        equals: login,
        mode: "insensitive",
      },
      is_active: true,
    },
    include: {
      roles: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  const passwordMatched = await verifyPassword(password, dbUser.password_hash);

  if (!passwordMatched) {
    return null;
  }

  const roleName = dbUser.roles?.role_name ?? "UNASSIGNED";
  const permissions = normalizePermissions(dbUser.roles?.permissions);

  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.username,
    name: dbUser.full_name?.trim() || dbUser.username,
    roleName,
    permissions,
    isDemo: false,
  };
}

async function authorizeBootstrapDemo(login: string, password: string) {
  const expectedLogin = env.DEMO_ADMIN_EMAIL.trim().toLowerCase();
  const inputLogin = login.trim().toLowerCase();
  const expectedPasswordCandidates = buildPasswordCandidates(env.DEMO_ADMIN_PASSWORD);
  const passwordMatched = expectedPasswordCandidates.has(password);
  const loginMatched = inputLogin === expectedLogin;

  if (!loginMatched || !passwordMatched) {
    return null;
  }

  return {
    id: "demo-admin",
    username: inputLogin,
    email: inputLogin,
    name: "System Admin",
    roleName: "OWNER",
    permissions: ROLE_PERMISSION_TEMPLATES.OWNER,
    isDemo: true,
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "SuperApp Auth",
      credentials: {
        login: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const inputLogin = credentials.login?.trim() ?? "";
        const inputPassword = credentials.password?.trim() ?? "";

        if (!inputLogin || !inputPassword) {
          return null;
        }

        const activeUserCount = await prisma.users.count({
          where: { is_active: true },
        });

        if (activeUserCount > 0) {
          return authorizeDatabaseUser(inputLogin, inputPassword);
        }

        return authorizeBootstrapDemo(inputLogin, inputPassword);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.name = user.name;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
        token.isDemo = user.isDemo;
      }

      if (trigger === "update") {
        const nextName =
          typeof session?.name === "string"
            ? session.name
            : typeof session?.user === "object" &&
                session.user &&
                "name" in session.user &&
                typeof session.user.name === "string"
              ? session.user.name
              : undefined;

        if (nextName) {
          token.name = nextName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.username = token.username ?? token.email ?? "";
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.roleName = token.roleName ?? "UNASSIGNED";
        session.user.permissions = token.permissions ?? [];
        session.user.isDemo = token.isDemo;
      }

      return session;
    },
  },
};
