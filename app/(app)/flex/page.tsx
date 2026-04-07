import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FlexBrowser } from "@/components/attendance/flex-browser";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { getFlexBlockWindow } from "@/lib/flex-attendance";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export const metadata = { title: "Flex Block" };
export const dynamic = "force-dynamic";

export default async function FlexPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const { dayStart, dayEnd } = getFlexBlockWindow();

  try {
    const [sessions, joinedRecord] = await Promise.all([
      prisma.attendanceSession.findMany({
        where: {
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
          isOpen: true,
        },
        orderBy: [{ type: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          type: true,
          location: true,
          capacity: true,
          hostName: true,
          clubId: true,
          _count: {
            select: {
              records: true,
            },
          },
        },
      }),
      prisma.attendanceRecord.findFirst({
        where: {
          userId: session.user.id,
          session: {
            date: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        select: {
          sessionId: true,
          status: true,
        },
      }),
    ]);

    return (
      <FlexBrowser
        sessions={sessions.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          location: item.location,
          capacity: item.capacity,
          attendeeCount: item._count.records,
          hostName: item.hostName,
          clubId: item.clubId,
        }))}
        joinedSessionId={joinedRecord?.sessionId ?? null}
        joinedStatus={joinedRecord?.status ?? null}
      />
    );
  } catch (error) {
    if (isPrismaMissingColumnError(error, "Attendance")) {
      return (
        <AttendanceSetupNotice
          title="Flex attendance needs the latest schema"
          description="The flex experience is unlocked, but this deployment still needs the attendance migration before students can browse and join sessions."
        />
      );
    }

    throw error;
  }
}
