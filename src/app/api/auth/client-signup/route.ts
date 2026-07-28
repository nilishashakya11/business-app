import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handle, ApiError } from "@/lib/api-auth";
import { clientSignupSchema } from "@/lib/validations";
import { Role } from "@prisma/client";

/**
 * Lightweight client account signup. Creates a CLIENT User plus a linked
 * Customer record so the person can book online and leave reviews. Public.
 */
export const POST = handle(async (req: NextRequest) => {
  const data = clientSignupSchema.parse(await req.json());
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  // Attach the customer profile to the first business (single-tenant dev setup).
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!business) throw new ApiError(400, "No business is available to register with yet");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const [firstName, ...rest] = data.name.trim().split(" ");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      role: Role.CLIENT,
      phone: data.phone,
      customerProfile: {
        create: {
          businessId: business.id,
          firstName: firstName || data.name,
          lastName: rest.join(" ") || null,
          email,
          phone: data.phone,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
});
