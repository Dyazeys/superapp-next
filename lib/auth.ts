import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/schemas/env";

function buildPasswordCandidates(value: string) {
  const trimmed = value.trim();
  const noEscapedDollar = trimmed.replace(/\\\$/g, "$");
  const withEscapedDollar = trimmed.replace(/\$/g, "\\$");
  const beforeHash = trimmed.split("#")[0]?.trim() ?? trimmed;

  return new Set([trimmed, noEscapedDollar, withEscapedDollar, beforeHash]);
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
      name: "Demo Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const inputEmail = credentials.email?.trim().toLowerCase() ?? "";
        const inputPassword = credentials.password?.trim() ?? "";
        const expectedEmail = env.DEMO_ADMIN_EMAIL.trim().toLowerCase();
        const expectedPasswordCandidates = buildPasswordCandidates(env.DEMO_ADMIN_PASSWORD);
        const passwordMatched = expectedPasswordCandidates.has(inputPassword);
        const emailMatched = inputEmail === expectedEmail;

        if (
          emailMatched &&
          passwordMatched
        ) {
          return {
            id: "demo-admin",
            email: inputEmail,
            name: "System Admin",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }

      return session;
    },
  },
};
