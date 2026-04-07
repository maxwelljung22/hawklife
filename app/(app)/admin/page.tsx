// app/(app)/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAllNhsRecords } from "@/lib/airtable";
import { AdminClient } from "./admin-client";
import { canAccessAdmin, canAccessOversight } from "@/lib/roles";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export const metadata = { title: "Admin Panel" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !canAccessOversight(session.user.role)) redirect("/dashboard?error=unauthorized");

  const isAdmin = canAccessAdmin(session.user.role);
  const advisorClubIds = !isAdmin
    ? (
        await prisma.membership.findMany({
          where: {
            userId: session.user.id,
            status: "ACTIVE",
            role: "FACULTY_ADVISOR",
          },
          select: { clubId: true },
        })
      ).map((membership) => membership.clubId)
    : [];

  const applicationWhere = isAdmin ? {} : { clubId: { in: advisorClubIds } };
  const clubSelect = Prisma.validator<Prisma.ClubSelect>()({
    id: true,
    slug: true,
    name: true,
    logoUrl: true,
    emoji: true,
    tagline: true,
    description: true,
    category: true,
    commitment: true,
    tags: true,
    isActive: true,
    requiresApp: true,
    meetingRoom: true,
    meetingDay: true,
    meetingTime: true,
    gradientFrom: true,
    gradientTo: true,
    pendingEditRequest: true,
    pendingEditSubmittedAt: true,
    pendingEditSubmittedById: true,
    pendingEditStatus: true,
    isFlagged: true,
    flagReason: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { memberships: { where: { status: "ACTIVE" } }, posts: true, events: true } },
  });

  try {
    const [clubs, users, applications, changelog, nhsRecords, totalEvents, attendanceCount, participatingStudents] = await Promise.all([
      prisma.club.findMany({
        orderBy: { name: "asc" },
        select: clubSelect,
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
        where: applicationWhere,
        orderBy: { createdAt: "desc" },
        include: {
          club:      { select: { id: true, name: true, emoji: true } },
          applicant: { select: { name: true, email: true, image: true } },
        },
      }),
      prisma.changelogEntry.findMany({ orderBy: { publishedAt: "desc" } }),
      getAllNhsRecords(),
      prisma.event.count({
        where: isAdmin ? {} : { clubId: { in: advisorClubIds } },
      }),
      prisma.attendanceRecord.count({
        where: isAdmin ? {} : { session: { clubId: { in: advisorClubIds } } },
      }),
      prisma.user.count({
        where: isAdmin
          ? { memberships: { some: { status: "ACTIVE" } } }
          : { memberships: { some: { status: "ACTIVE", clubId: { in: advisorClubIds } } } },
      }),
    ]);

    return (
      <AdminClient
        clubs={clubs as any}
        users={users as any}
        applications={applications as any}
        changelog={changelog as any}
        nhsRecords={nhsRecords}
        currentRole={session.user.role}
        analytics={{
          totalEvents,
          attendanceCount,
          participatingStudents,
          advisorClubIds,
        }}
      />
    );
  } catch (error) {
    if (isPrismaMissingColumnError(error)) {
      return (
        <AttendanceSetupNotice
          title="Admin panel needs the latest database updates"
          description="This deployment is running newer oversight and attendance code than the production database currently supports. Apply the latest HawkLife migrations, then refresh the admin panel."
        />
      );
    }

    throw error;
  }
}
