import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, handle, audit } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z
  .object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: "Current password is required to set a new one",
    path: ["currentPassword"],
  });

/** PATCH /api/profile — update the signed-in user's own profile. */
export const PATCH = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const body = profileSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: { name?: string; phone?: string | null; passwordHash?: string } = {};
  if (body.name) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone || null;

  if (body.newPassword) {
    const ok = user.passwordHash
      ? await bcrypt.compare(body.currentPassword ?? "", user.passwordHash)
      : false;
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  await prisma.user.update({ where: { id: ctx.userId }, data });
  await audit(ctx, "profile.updated", "User", ctx.userId);

  return NextResponse.json({ ok: true });
});
