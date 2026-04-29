import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      roleName: string;
      permissions: string[];
      isDemo?: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    roleName: string;
    permissions: string[];
    isDemo?: boolean;
    email?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    roleName?: string;
    permissions?: string[];
    isDemo?: boolean;
    email?: string | null;
    name?: string | null;
  }
}
