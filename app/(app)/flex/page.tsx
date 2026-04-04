import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getFlexBlockWindow } from "@/lib/flex-attendance";
import { FlexBrowser } from "@/components/attendance/flex-browser";

export const metadata = { title: "Flex Block" };
export const dynamic = "force-dynamic";

export default async function FlexPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const { dayStart, dayEnd } = getFlexBlockWindow();

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
      include: {
        records: {
          select: { id: true },
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
      orderBy: {
        joinedAt: "desc",
      },
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
        attendeeCount: item.records.length,
        hostName: item.hostName,
        clubId: item.clubId,
      }))}
      joinedSessionId={joinedRecord?.sessionId ?? null}
      joinedStatus={joinedRecord?.status ?? null}
    />
  );
}
