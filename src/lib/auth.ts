import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { resolvePermissions } from "@/lib/rbac";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            permissions: { include: { permission: true } },
            branches: true,
          },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const overrides: Record<string, boolean> = {};
        for (const up of user.permissions) {
          overrides[up.permission.key] = up.granted;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          overrides,
          branchIds: user.branches.map((b) => b.branchId),
          primaryBranchId:
            user.branches.find((b) => b.isPrimary)?.branchId ??
            user.branches[0]?.branchId ??
            null,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: persist role/permission data into the token.
        const u = user as unknown as {
          role: Role;
          overrides: Record<string, boolean>;
          branchIds: string[];
          primaryBranchId: string | null;
        };
        token.role = u.role;
        token.overrides = u.overrides;
        token.branchIds = u.branchIds;
        token.primaryBranchId = u.primaryBranchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.branchIds = (token.branchIds as string[]) ?? [];
        session.user.primaryBranchId = (token.primaryBranchId as string | null) ?? null;
        const overrides = (token.overrides as Record<string, boolean>) ?? {};
        session.user.permissions = Array.from(
          resolvePermissions(token.role as Role, overrides),
        );
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Server-side helper to get the current session. */
export function auth() {
  return getServerSession(authOptions);
}
