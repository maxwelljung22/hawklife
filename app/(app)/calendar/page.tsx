// app/(app)/calendar/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarClient } from "./calendar-client";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const events = await prisma.event.findMany({
    where: { startTime: { gte: start, lte: end } },
    orderBy: { startTime: "asc" },
    include: {
      club: { select: { name: true, emoji: true, slug: true, gradientFrom: true, gradientTo: true } },
    },
  });
  return <CalendarClient events={events as any} />;
}
