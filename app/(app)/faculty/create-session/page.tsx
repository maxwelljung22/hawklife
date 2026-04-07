import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessFacultyTools } from "@/lib/roles";
import { FacultySessionManager } from "@/components/attendance/faculty-session-manager";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { getFlexBlockWindow } from "@/lib/flex-attendance";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export const metadata = { title: "Create Session" };
export const dynamic = "force-dynamic";

export default async function FacultyCreateSessionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  if (!canAccessFacultyTools(session.user.role)) redirect("/dashboard");

  const { date } = getFlexBlockWindow();

  try {
    const [clubs, students, sessions] = await Promise.all([
      prisma.club.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          meetingRoom: true,
        },
      }),
      prisma.user.findMany({
        where: {
          role: {
            in: ["STUDENT", "STUDENT_LEADER"],
          },
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          grade: true,
          graduationYear: true,
        },
      }),
      prisma.attendanceSession.findMany({
        where: { date },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          clubId: true,
          location: true,
          capacity: true,
          hostName: true,
          isOpen: true,
          records: {
            orderBy: [{ checkIn: "desc" }, { joinedAt: "desc" }],
            select: {
              id: true,
              status: true,
              present: true,
              joinedAt: true,
              checkIn: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  grade: true,
                  graduationYear: true,
                },
              },
            },
          },
          _count: {
            select: {
              records: true,
            },
          },
        },
      }),
    ]);

    return (
      <FacultySessionManager
        clubs={clubs}
        students={students}
        currentRole={session.user.role}
        sessions={sessions.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          clubId: item.clubId,
          location: item.location,
          capacity: item.capacity,
          attendeeCount: item._count.records,
          hostName: item.hostName,
          isOpen: item.isOpen,
          attendees: item.records.map((record) => ({
            id: record.id,
            status: record.status,
            present: record.present,
            joinedAt: record.joinedAt.toISOString(),
            checkIn: record.checkIn ? record.checkIn.toISOString() : null,
            user: record.user,
          })),
        }))}
      />
    );
  } catch (error) {
    if (isPrismaMissingColumnError(error, "Attendance")) {
      return (
        <AttendanceSetupNotice
          title="Faculty session tools need the latest schema"
          description="Session creation is unlocked, but this deployment still needs the attendance migration before faculty can create and manage live flex sessions."
        />
      );
    }

    throw error;
  }
}
