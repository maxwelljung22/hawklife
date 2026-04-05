// app/(app)/applications/page.tsx
import { prisma } from "@/lib/prisma";
import { ApplicationsClient } from "./applications-client";
import { getSession } from "@/lib/session";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session?.user) return null;

  const [myApplications, openForms] = await Promise.all([
    prisma.application.findMany({
      where: { applicantId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { club: { select: { name: true, emoji: true, slug: true } } },
    }),
    prisma.appForm.findMany({
      where: {
        isOpen: true,
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        club: {
          isActive: true,
          // Don't show forms for clubs user already applied to
          NOT: { applications: { some: { applicantId: session.user.id } } },
        },
      },
      include: {
        club: {
          select: {
            id: true, name: true, emoji: true, slug: true,
            description: true, gradientFrom: true, gradientTo: true, category: true,
          },
        },
      },
    }),
  ]);

  return (
    <ApplicationsClient
      myApplications={myApplications as any}
      openForms={openForms as any}
    />
  );
}
