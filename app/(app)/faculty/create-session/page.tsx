import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getFlexBlockWindow } from "@/lib/flex-attendance";
import { canAccessFacultyTools } from "@/lib/roles";
import { FacultySessionManager } from "@/components/attendance/faculty-session-manager";

export const metadata = { title: "Create Session" };
export const dynamic = "force-dynamic";

export default async function FacultyCreateSessionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  if (!canAccessFacultyTools(session.user.role)) redirect("/dashboard");

  const { dayStart, dayEnd } = getFlexBlockWindow();

  const [clubs, sessions] = await Promise.all([
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
        records: { select: { id: true } },
      },
    }),
  ]);

  return (
    <FacultySessionManager
      clubs={clubs}
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
      }))}
    />
  );
}
