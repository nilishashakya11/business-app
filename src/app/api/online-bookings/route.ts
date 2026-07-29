import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ApiError, audit } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { onlineBookingSchema } from "@/lib/validations";

/**
 * Public online booking endpoint. A signed-in CLIENT books against their linked
 * Customer; an anonymous visitor supplies guest details and we create/find a
 * Customer on the fly. Either way the appointment lands on the staff calendar
 * immediately (staff calendars poll and pick it up within seconds).
 */
export const POST = handle(async (req: NextRequest) => {
  const data = onlineBookingSchema.parse(await req.json());

  const branch = await prisma.branch.findFirst({
    where: { id: data.branchId, isActive: true },
    select: { id: true, businessId: true },
  });
  if (!branch) throw new ApiError(400, "This location is not available for booking");

  // The chosen staff member must work at the branch and be bookable.
  const staff = await prisma.staff.findFirst({
    where: { id: data.staffId, branchId: branch.id, isBookable: true },
    select: { id: true },
  });
  if (!staff) throw new ApiError(400, "This team member is not available");

  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds }, branchId: branch.id, isActive: true },
    select: { id: true, durationMinutes: true, price: true },
  });
  if (services.length !== data.serviceIds.length) {
    throw new ApiError(400, "One or more services are unavailable");
  }

  const totalMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

  if (startTime.getTime() < Date.now()) {
    throw new ApiError(400, "Choose a time in the future");
  }

  // Resolve the customer: signed-in client, or guest.
  const session = await auth();
  let customerId: string | null = null;

  if (session?.user?.role === "CLIENT") {
    const profile = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    customerId = profile?.id ?? null;
  }

  if (!customerId) {
    if (!data.guest?.firstName) {
      throw new ApiError(400, "Enter your details to complete the booking");
    }
    // Reuse an existing customer with the same phone/email in this business.
    const existing =
      data.guest.email || data.guest.phone
        ? await prisma.customer.findFirst({
            where: {
              businessId: branch.businessId,
              OR: [
                data.guest.email ? { email: data.guest.email } : undefined,
                data.guest.phone ? { phone: data.guest.phone } : undefined,
              ].filter(Boolean) as object[],
            },
            select: { id: true },
          })
        : null;

    if (existing) {
      customerId = existing.id;
    } else {
      const created = await prisma.customer.create({
        data: {
          businessId: branch.businessId,
          firstName: data.guest.firstName,
          lastName: data.guest.lastName || null,
          email: data.guest.email || null,
          phone: data.guest.phone || null,
        },
        select: { id: true },
      });
      customerId = created.id;
    }
  }

  // Guard against double-booking the same staff member.
  const clash = await prisma.appointment.findFirst({
    where: {
      staffId: staff.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });
  if (clash) throw new ApiError(409, "That time slot was just taken — please pick another");

  const appointment = await prisma.appointment.create({
    data: {
      branchId: branch.id,
      customerId,
      staffId: staff.id,
      status: "BOOKED",
      startTime,
      endTime,
      notes: data.notes || null,
      isOnline: true,
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          priceAtBooking: s.price,
          durationMinutes: s.durationMinutes,
        })),
      },
    },
    select: { id: true, startTime: true },
  });

  await audit(null, "appointment.online_booked", "Appointment", appointment.id, {
    online: true,
  });

  return NextResponse.json({ ok: true, appointment }, { status: 201 });
});
