import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BookClient, type BookBranch } from "./book-client";

export const metadata = { title: "Book an appointment — Glow & Go" };

export default async function BookPage() {
  const session = await auth();
  const isClient = session?.user?.role === "CLIENT";

  const branches = await prisma.branch.findMany({
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
          categoryId: true,
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
  });

  // Shape into a serialisable structure for the client wizard.
  const data: BookBranch[] = branches.map((b) => ({
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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a service, pick your team member and confirm a time — all online.
        </p>
      </div>
      <BookClient branches={data} isSignedInClient={isClient} />
    </div>
  );
}
