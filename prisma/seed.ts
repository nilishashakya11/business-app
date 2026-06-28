/**
 * Seed script — creates a demo business with two branches, users for each role,
 * staff, services, customers, appointments, invoices, payments and inventory.
 *
 * Run: npm run db:seed
 */
import { PrismaClient, Role, AppointmentStatus, PaymentMethod, PaymentStatus, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS } from "../src/lib/rbac";

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60000);
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  console.log("🌱  Seeding database...");

  // Clean slate (dev only)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.commission.deleteMany(),
    prisma.refund.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.appointmentService.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.customerPackage.deleteMany(),
    prisma.package.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.membershipPlan.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.staffService.deleteMany(),
    prisma.serviceAddOn.deleteMany(),
    prisma.service.deleteMany(),
    prisma.serviceCategory.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.leave.deleteMany(),
    prisma.workingHour.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.userPermission.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.userBranch.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.business.deleteMany(),
  ]);

  // Business + branches
  const business = await prisma.business.create({
    data: {
      name: "Glow & Go Wellness",
      currency: "NPR",
      timezone: "Asia/Kathmandu",
    },
  });

  const branchMain = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: "Thamel Flagship",
      address: "Thamel Marg",
      city: "Kathmandu",
      phone: "+977-1-4000001",
      email: "thamel@glowandgo.com",
    },
  });

  const branchLalitpur = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: "Lalitpur Studio",
      address: "Jhamsikhel",
      city: "Lalitpur",
      phone: "+977-1-4000002",
      email: "lalitpur@glowandgo.com",
    },
  });

  const branches = [branchMain, branchLalitpur];

  // Permissions catalog
  await prisma.permission.createMany({
    data: Object.values(PERMISSIONS).map((key) => ({ key })),
    skipDuplicates: true,
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Users
  const admin = await prisma.user.create({
    data: {
      name: "Aarati Sharma",
      email: "admin@glowandgo.com",
      passwordHash,
      role: Role.ADMIN,
      phone: "+977-9800000001",
      branches: {
        create: [
          { branchId: branchMain.id, isPrimary: true },
          { branchId: branchLalitpur.id },
        ],
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Bipin Thapa",
      email: "manager@glowandgo.com",
      passwordHash,
      role: Role.MANAGER,
      phone: "+977-9800000002",
      branches: { create: [{ branchId: branchMain.id, isPrimary: true }] },
    },
  });

  // Team members (also staff)
  const staffSeed = [
    { name: "Sita Gurung", email: "sita@glowandgo.com", branch: branchMain, title: "Senior Stylist", color: "#8b5cf6", commission: 15 },
    { name: "Ramesh K.C.", email: "ramesh@glowandgo.com", branch: branchMain, title: "Barber", color: "#06b6d4", commission: 12 },
    { name: "Puja Maharjan", email: "puja@glowandgo.com", branch: branchLalitpur, title: "Beautician", color: "#f59e0b", commission: 14 },
    { name: "Nabin Rai", email: "nabin@glowandgo.com", branch: branchLalitpur, title: "Massage Therapist", color: "#10b981", commission: 18 },
  ];

  const staffRecords = [];
  for (const s of staffSeed) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash,
        role: Role.TEAM_MEMBER,
        branches: { create: [{ branchId: s.branch.id, isPrimary: true }] },
        staffProfile: {
          create: {
            branchId: s.branch.id,
            jobTitle: s.title,
            color: s.color,
            commissionRate: s.commission,
            hiredAt: daysAgo(200),
            workingHours: {
              create: Array.from({ length: 7 }, (_, day) => ({
                dayOfWeek: day,
                startTime: "09:00",
                endTime: "18:00",
                isOff: day === 6, // Saturday off
              })),
            },
          },
        },
      },
      include: { staffProfile: true },
    });
    staffRecords.push({ ...s, staff: user.staffProfile! });
  }

  // Service categories + services
  const catHair = await prisma.serviceCategory.create({ data: { name: "Hair", color: "#8b5cf6", sortOrder: 1 } });
  const catSpa = await prisma.serviceCategory.create({ data: { name: "Spa & Massage", color: "#10b981", sortOrder: 2 } });
  const catBeauty = await prisma.serviceCategory.create({ data: { name: "Beauty", color: "#f59e0b", sortOrder: 3 } });

  const serviceSeed = [
    { name: "Haircut & Style", cat: catHair, duration: 45, price: 1200 },
    { name: "Hair Color", cat: catHair, duration: 90, price: 3500 },
    { name: "Beard Trim", cat: catHair, duration: 20, price: 500 },
    { name: "Swedish Massage", cat: catSpa, duration: 60, price: 2500 },
    { name: "Deep Tissue Massage", cat: catSpa, duration: 75, price: 3200 },
    { name: "Facial - Classic", cat: catBeauty, duration: 50, price: 1800 },
    { name: "Manicure", cat: catBeauty, duration: 40, price: 900 },
    { name: "Pedicure", cat: catBeauty, duration: 45, price: 1100 },
  ];

  const services = [];
  for (const branch of branches) {
    for (const s of serviceSeed) {
      const svc = await prisma.service.create({
        data: {
          branchId: branch.id,
          categoryId: s.cat.id,
          name: s.name,
          durationMinutes: s.duration,
          price: s.price,
          taxRate: 13,
        },
      });
      services.push({ ...svc, branchId: branch.id });
    }
  }

  // Link staff to services in their branch
  for (const sr of staffRecords) {
    const branchServices = services.filter((sv) => sv.branchId === sr.branch.id);
    for (const sv of branchServices.slice(0, 5)) {
      await prisma.staffService.create({
        data: { staffId: sr.staff.id, serviceId: sv.id },
      });
    }
  }

  // Customers
  const customerSeed = [
    { firstName: "Manisha", lastName: "Shrestha", phone: "+977-9811111111", email: "manisha@example.com" },
    { firstName: "Deepak", lastName: "Adhikari", phone: "+977-9822222222", email: "deepak@example.com" },
    { firstName: "Sunita", lastName: "Lama", phone: "+977-9833333333", email: "sunita@example.com" },
    { firstName: "Anish", lastName: "Bajracharya", phone: "+977-9844444444", email: "anish@example.com" },
    { firstName: "Rekha", lastName: "Tamang", phone: "+977-9855555555", email: "rekha@example.com" },
    { firstName: "Prakash", lastName: "Joshi", phone: "+977-9866666666", email: "prakash@example.com" },
    { firstName: "Bina", lastName: "Karki", phone: "+977-9877777777", email: "bina@example.com" },
    { firstName: "Gopal", lastName: "Neupane", phone: "+977-9888888888", email: "gopal@example.com" },
  ];

  const customers = [];
  for (const c of customerSeed) {
    const cust = await prisma.customer.create({
      data: {
        businessId: business.id,
        ...c,
        loyaltyPoints: Math.floor(Math.random() * 500),
        createdAt: daysAgo(Math.floor(Math.random() * 180)),
      },
    });
    customers.push(cust);
  }

  // Appointments + invoices + payments over the last 60 days
  const statuses: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.BOOKED,
  ];
  const methods: PaymentMethod[] = [
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.ESEWA,
    PaymentMethod.KHALTI,
  ];

  let invoiceCounter = 1;
  let apptCount = 0;

  for (let day = 60; day >= 0; day--) {
    // 2-5 appointments per day
    const perDay = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < perDay; i++) {
      const branch = pick(branches, apptCount);
      const branchStaff = staffRecords.filter((s) => s.branch.id === branch.id);
      const sr = pick(branchStaff, i);
      const branchServices = services.filter((sv) => sv.branchId === branch.id);
      const svc = pick(branchServices, apptCount + i);
      const customer = pick(customers, apptCount + i);
      const status = pick(statuses, apptCount + i);

      const hour = 9 + ((apptCount + i) % 8);
      const start = daysAgo(day, hour, 0);
      const end = addMinutes(start, svc.durationMinutes);

      const appt = await prisma.appointment.create({
        data: {
          branchId: branch.id,
          customerId: customer.id,
          staffId: sr.staff.id,
          status,
          startTime: start,
          endTime: end,
          isOnline: Math.random() > 0.6,
          createdAt: addMinutes(start, -Math.floor(Math.random() * 2880)),
          services: {
            create: {
              serviceId: svc.id,
              priceAtBooking: svc.price,
              durationMinutes: svc.durationMinutes,
            },
          },
        },
      });
      apptCount++;

      // Only completed appointments generate paid invoices
      if (status === AppointmentStatus.COMPLETED) {
        const price = Number(svc.price);
        const taxRate = 13;
        const taxTotal = Math.round(price * (taxRate / 100) * 100) / 100;
        const total = price + taxTotal;

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${String(invoiceCounter++).padStart(5, "0")}`,
            branchId: branch.id,
            customerId: customer.id,
            appointmentId: appt.id,
            createdById: manager.id,
            status: InvoiceStatus.PAID,
            subtotal: price,
            discountTotal: 0,
            taxTotal,
            total,
            amountPaid: total,
            issuedAt: end,
            createdAt: end,
            items: {
              create: {
                description: svc.name,
                serviceId: svc.id,
                staffId: sr.staff.id,
                quantity: 1,
                unitPrice: price,
                taxRate,
                lineTotal: total,
              },
            },
          },
          include: { items: true },
        });

        const method = pick(methods, apptCount);
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: total,
            method,
            status: PaymentStatus.COMPLETED,
            paidAt: end,
            createdAt: end,
          },
        });

        // Commission for the staff member
        const commissionRate = Number(sr.commission);
        await prisma.commission.create({
          data: {
            staffId: sr.staff.id,
            invoiceItemId: invoice.items[0].id,
            amount: Math.round(price * (commissionRate / 100) * 100) / 100,
            rate: commissionRate,
            earnedAt: end,
          },
        });
      }
    }
  }

  // Suppliers + products + stock
  for (const branch of branches) {
    const supplier = await prisma.supplier.create({
      data: {
        name: "Himalayan Beauty Supplies",
        contact: "Kiran Shah",
        phone: "+977-9801234567",
        email: "sales@himalayanbeauty.com",
      },
    });

    const productSeed = [
      { name: "Shampoo 500ml", sku: "SH-500", cost: 400, sell: 750, qty: 40, low: 10 },
      { name: "Hair Color Tube", sku: "HC-01", cost: 250, sell: 500, qty: 8, low: 10 },
      { name: "Massage Oil 1L", sku: "MO-1L", cost: 600, sell: 1200, qty: 25, low: 5 },
      { name: "Face Mask Pack", sku: "FM-10", cost: 150, sell: 350, qty: 3, low: 5 },
      { name: "Nail Polish", sku: "NP-RED", cost: 120, sell: 280, qty: 60, low: 15 },
    ];

    for (const p of productSeed) {
      const product = await prisma.product.create({
        data: {
          branchId: branch.id,
          supplierId: supplier.id,
          name: p.name,
          sku: p.sku,
          costPrice: p.cost,
          sellPrice: p.sell,
          quantity: p.qty,
          lowStockLevel: p.low,
        },
      });
      await prisma.stockMovement.create({
        data: {
          branchId: branch.id,
          productId: product.id,
          type: "PURCHASE",
          quantity: p.qty,
          reason: "Initial stock",
        },
      });
    }
  }

  // Membership plans + packages
  await prisma.membershipPlan.createMany({
    data: [
      { name: "Silver", price: 5000, durationDays: 180, discountRate: 5 },
      { name: "Gold", price: 12000, durationDays: 365, discountRate: 10 },
    ],
  });
  await prisma.package.createMany({
    data: [
      { name: "5x Massage Package", price: 11000, totalSessions: 5, validityDays: 180 },
      { name: "3x Facial Package", price: 4800, totalSessions: 3, validityDays: 120 },
    ],
  });

  console.log("✅  Seed complete.");
  console.log("\nLogin credentials (password: Password123!):");
  console.log("  Admin:    admin@glowandgo.com");
  console.log("  Manager:  manager@glowandgo.com");
  console.log("  Team:     sita@glowandgo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
