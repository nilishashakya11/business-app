import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BookClient, type BookBranch } from "../book-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug }, select: { name: true } });
  return { title: business ? `Book at ${business.name} — Glow & Go` : "Book — Glow & Go" };
}

export default async function BusinessBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const isClient = session?.user?.role === "CLIENT";

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      tagline: true,
      branches: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          city: true,
          services: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              durationMinutes: true,
              price: true,
              category: { select: { name: true } },
              staff: {
                select: {
                  staff: {
                    select: {
                      id: true,
                      isBookable: true,
                      jobTitle: true,
                      color: true,
                      user: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!business) notFound();

  const data: BookBranch[] = business.branches.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    services: b.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      category: s.category?.name ?? "Other",
      staff: s.staff
        .map((ss) => ss.staff)
        .filter((st) => st.isBookable)
        .map((st) => ({
          id: st.id,
          name: st.user.name,
          jobTitle: st.jobTitle,
          color: st.color,
        })),
    })),
  }));

  return (
    <div>
      <Link
        href="/book"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All businesses
      </Link>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{business.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {business.tagline ?? "Choose a service, pick your team member and confirm a time."}
        </p>
      </div>
      <BookClient branches={data} isSignedInClient={isClient} />
    </div>
  );
}
