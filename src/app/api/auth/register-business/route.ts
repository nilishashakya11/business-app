import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handle, ApiError } from "@/lib/api-auth";
import { businessOnboardingSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import { Role } from "@prisma/client";

/**
 * Business onboarding — mirrors Fresha's "register your business" flow.
 * Creates the Business, its first Branch, the owner User (ADMIN) and any
 * starter services in a single transaction. Public (no auth required).
 */
export const POST = handle(async (req: NextRequest) => {
  const data = businessOnboardingSchema.parse(await req.json());
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Build a unique slug for the business's public booking link.
  const base = slugify(data.businessName) || "business";
  let slug = base;
  for (let i = 2; await prisma.business.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Ensure the permission catalog exists (idempotent).
    await tx.permission.createMany({
      data: Object.values(PERMISSIONS).map((key) => ({ key })),
      skipDuplicates: true,
    });

    const business = await tx.business.create({
      data: {
        name: data.businessName,
        slug,
        currency: data.currency,
        timezone: data.timezone,
      },
    });

    const branch = await tx.branch.create({
      data: {
        businessId: business.id,
        name: data.branchName,
        address: data.address,
        city: data.city,
        phone: data.branchPhone,
        email,
      },
    });

    const owner = await tx.user.create({
      data: {
        name: data.ownerName,
        email,
        passwordHash,
        role: Role.ADMIN,
        phone: data.phone,
        branches: { create: [{ branchId: branch.id, isPrimary: true }] },
      },
    });

    if (data.services.length > 0) {
      await tx.service.createMany({
        data: data.services.map((s) => ({
          branchId: branch.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          taxRate: 0,
        })),
      });
    }

    return { businessId: business.id, branchId: branch.id, userId: owner.id };
  });

  return NextResponse.json({ ok: true, ...result }, { status: 201 });
});
