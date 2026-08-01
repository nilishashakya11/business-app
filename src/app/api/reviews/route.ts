import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ApiError } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";

/**
 * POST /api/reviews — a signed-in CLIENT leaves a review for one of their own
 * COMPLETED appointments. One review per appointment. The staff member and
 * (first) service are derived from the appointment.
 */
export const POST = handle(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    throw new ApiError(403, "Only clients can leave reviews");
  }

  const data = reviewSchema.parse(await req.json());

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!customer) throw new ApiError(400, "No client profile found");

  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    select: {
      id: true,
      customerId: true,
      staffId: true,
      status: true,
      services: { select: { serviceId: true }, take: 1 },
    },
  });
  if (!appointment || appointment.customerId !== customer.id) {
    throw new ApiError(404, "Appointment not found");
  }
  if (appointment.status !== "COMPLETED") {
    throw new ApiError(400, "You can only review completed appointments");
  }
  if (!appointment.staffId) {
    throw new ApiError(400, "This appointment has no team member to review");
  }

  const existing = await prisma.review.findUnique({
    where: { appointmentId: appointment.id },
    select: { id: true },
  });
  if (existing) throw new ApiError(409, "You've already reviewed this appointment");

  const review = await prisma.review.create({
    data: {
      customerId: customer.id,
      staffId: appointment.staffId,
      appointmentId: appointment.id,
      serviceId: appointment.services[0]?.serviceId ?? null,
      rating: data.rating,
      comment: data.comment || null,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
});
