import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canManageClubAttendanceSession } from "@/lib/flex-attendance";
import { QrDisplay } from "@/components/attendance/qr-display";
import { Button } from "@/components/ui/button";
import { ensureClubFlexSession } from "@/app/(app)/flex/actions";

export const metadata = { title: "Attendance QR" };
export const dynamic = "force-dynamic";

async function ClubAttendanceEmptyState({ clubId, clubName }: { clubId: string; clubName: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
      <div className="surface-card w-full rounded-[34px] p-8 text-center sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Club attendance</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-foreground">{clubName}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-[15px]">
          There isn&apos;t a live flex session for this club yet. Open one now and the QR code will be ready for students
          immediately.
        </p>
        <form action={async () => {
          "use server";
          await ensureClubFlexSession(clubId);
        }} className="mt-6">
          <Button size="lg">Open today&apos;s club session</Button>
        </form>
      </div>
    </div>
  );
}

export default async function ClubAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const club = await prisma.club.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!club) redirect("/clubs");

  const canManage = await canManageClubAttendanceSession(club.id, session.user.id, session.user.role);
  if (!canManage) redirect("/clubs");

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const attendanceSession = await prisma.attendanceSession.findFirst({
    where: {
      clubId: club.id,
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
    },
  });

  if (!attendanceSession) {
    return <ClubAttendanceEmptyState clubId={club.id} clubName={club.name} />;
  }

  return (
    <QrDisplay
      sessionId={attendanceSession.id}
      title={attendanceSession.title}
      subtitle="Display this live QR at the front of the room for students to check in."
      typeLabel="Club attendance"
    />
  );
}
