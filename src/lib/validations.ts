import { z } from "zod";

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

// ---- Client self-serve signup ----
export const clientSignupSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ---- Business onboarding (Fresha-style registration) ----
export const businessOnboardingSchema = z.object({
  // Owner account
  ownerName: z.string().min(2, "Enter your name"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  // Business
  businessName: z.string().min(2, "Enter your business name"),
  currency: z.string().default("NPR"),
  timezone: z.string().default("Asia/Kathmandu"),
  // First branch / location
  branchName: z.string().min(1, "Enter a location name"),
  address: z.string().optional(),
  city: z.string().optional(),
  branchPhone: z.string().optional(),
  // Optional starter services created during onboarding
  services: z
    .array(
      z.object({
        name: z.string().min(1),
        durationMinutes: z.coerce.number().int().min(5).default(30),
        price: z.coerce.number().min(0).default(0),
      }),
    )
    .default([]),
});

// ---- Reviews ----
export const reviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ---- Online booking (client self-serve) ----
export const onlineBookingSchema = z.object({
  branchId: z.string().min(1),
  staffId: z.string().min(1, "Choose a team member"),
  serviceIds: z.array(z.string()).min(1, "Select at least one service"),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
  // Guest details when the booker has no account
  guest: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
    })
    .optional(),
});

// ---- Customers ----
export const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().datetime().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// ---- Services ----
export const serviceSchema = z.object({
  branchId: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(5),
  price: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).default(13),
  isActive: z.boolean().default(true),
});

// ---- Appointments ----
export const appointmentSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  staffId: z.string().optional().nullable(),
  startTime: z.string().datetime(),
  serviceIds: z.array(z.string()).min(1, "Select at least one service"),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
  status: z
    .enum([
      "BOOKED",
      "CONFIRMED",
      "ARRIVED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
      "WAITLIST",
    ])
    .default("BOOKED"),
});

export const appointmentStatusSchema = z.object({
  status: z.enum([
    "BOOKED",
    "CONFIRMED",
    "ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "WAITLIST",
  ]),
});

// ---- Staff ----
export const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  branchId: z.string().min(1),
  jobTitle: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  color: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TEAM_MEMBER"]).default("TEAM_MEMBER"),
  password: z.string().min(8).optional(),
});

// ---- Billing ----
export const invoiceItemSchema = z.object({
  description: z.string().min(1),
  serviceId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  staffId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});

export const invoiceSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1),
  discountTotal: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum([
    "CASH",
    "CARD",
    "ESEWA",
    "KHALTI",
    "FONEPAY",
    "IMEPAY",
    "BANK_TRANSFER",
    "LOYALTY_POINTS",
    "COMPLIMENTARY",
  ]),
});

export const refundSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().optional(),
});

// ---- Inventory ----
export const productSchema = z.object({
  branchId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0).default(0),
  sellPrice: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(0).default(0),
  lowStockLevel: z.coerce.number().int().min(0).default(5),
  unit: z.string().default("pcs"),
});

export const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int().refine((n) => n !== 0, "Enter a non-zero amount"),
  type: z.enum(["PURCHASE", "ADJUSTMENT", "RETURN", "CONSUMPTION"]).default("ADJUSTMENT"),
  reason: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ---- Payment gateway init ----
export const initiatePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  gateway: z.enum(["ESEWA", "KHALTI", "FONEPAY", "IMEPAY"]),
  returnUrl: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type ClientSignupInput = z.infer<typeof clientSignupSchema>;
export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type OnlineBookingInput = z.infer<typeof onlineBookingSchema>;
