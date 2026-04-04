// app/(app)/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAllNhsRecords } from "@/lib/airtable";
import { AdminClient } from "./admin-client";
import { canAccessAdmin } from "@/lib/roles";

export const metadata = { title: "Admin Panel" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) redirect("/dashboard?error=unauthorized");

  const [clubs, users, applications, changelog, nhsRecords] = await Promise.all([
    prisma.club.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { memberships: { where: { status: "ACTIVE" } }, posts: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
        memberships: {
          where: { status: "ACTIVE" },
          include: { club: { select: { id: true, name: true, emoji: true } } },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
      },
    }),
    prisma.application.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      include: {
        club:      { select: { name: true, emoji: true } },
        applicant: { select: { name: true, email: true, image: true } },
      },
    }),
    prisma.changelogEntry.findMany({ orderBy: { publishedAt: "desc" } }),
    getAllNhsRecords(),
  ]);

  return (
    <AdminClient
      clubs={clubs as any}
      users={users as any}
      applications={applications as any}
      changelog={changelog as any}
      nhsRecords={nhsRecords}
    />
  );
}
