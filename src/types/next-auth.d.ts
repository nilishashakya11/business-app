import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      permissions: string[];
      branchIds: string[];
      primaryBranchId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    overrides: Record<string, boolean>;
    branchIds: string[];
    primaryBranchId: string | null;
  }
}
