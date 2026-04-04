import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getFlexBlockWindow } from "@/lib/flex-attendance";
import { canAccessFacultyTools } from "@/lib/roles";
import { FacultySessionManager } from "@/components/attendance/faculty-session-manager";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export const metadata = { title: "Create Session" };
export const dynamic = "force-dynamic";

export default async function FacultyCreateSessionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  if (!canAccessFacultyTools(session.user.role)) redirect("/dashboard");

  const { dayStart, dayEnd } = getFlexBlockWindow();

  try {
    const [clubs, sessions, students] = await Promise.all([
      prisma.club.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          meetingRoom: true,
        },
      }),
    prisma.attendanceSession.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      orderBy: [{ type: "asc" }, { title: "asc" }],
      include: {
        records: {
          orderBy: { joinedAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

    return (
      <FacultySessionManager
        clubs={clubs}
        students={students}
        sessions={sessions.map((sessionItem) => ({
          id: sessionItem.id,
          title: sessionItem.title,
          type: sessionItem.type,
          clubId: sessionItem.clubId,
          location: sessionItem.location,
          capacity: sessionItem.capacity,
          attendeeCount: sessionItem.records.length,
          hostName: sessionItem.hostName,
          isOpen: sessionItem.isOpen,
          attendees: sessionItem.records.map((record) => ({
            id: record.id,
            status: record.status,
            present: record.present,
            joinedAt: record.joinedAt.toISOString(),
            checkIn: record.checkIn?.toISOString() ?? null,
            user: record.user,
          })),
        }))}
      />
    );
  } catch (error) {
    if (isPrismaMissingColumnError(error, "Attendance")) {
      return (
        <AttendanceSetupNotice
          title="Session tools need one database update"
          description="Faculty tools are deployed, but HawkLife still needs the newest attendance migration in production before sessions and QR codes can be managed."
        />
      );
    }

    throw error;
  }
}
