import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageClubAttendanceSession,
  createStaticQrValue,
  getSessionTypeLabel,
} from "@/lib/flex-attendance";
import { canAccessFacultyTools } from "@/lib/roles";
import { QrPrintClient } from "@/components/attendance/qr-print-client";

export const dynamic = "force-dynamic";

function buildQrImageUrl(qrValue: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(qrValue)}`;
}

export default async function FlexPrintQrPage({
  searchParams,
}: {
  searchParams?: Promise<{ sessionId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const params = (await searchParams) ?? {};
  const sessionId = params.sessionId;
  if (!sessionId) notFound();

  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      type: true,
      clubId: true,
      createdById: true,
      qrCode: true,
    },
  });

  if (!attendanceSession) notFound();

  const canManage = attendanceSession.clubId
    ? await canManageClubAttendanceSession(attendanceSession.clubId, session.user.id, session.user.role)
    : canAccessFacultyTools(session.user.role) || attendanceSession.createdById === session.user.id;

  if (!canManage) notFound();

  const qrValue = createStaticQrValue(attendanceSession);
  const typeLabel = getSessionTypeLabel(attendanceSession.type);

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#161311] print:bg-white">
      <QrPrintClient />
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 sm:py-10 print:max-w-none print:px-0 print:py-0">
        <section className="mx-auto overflow-hidden rounded-[36px] border border-[rgba(139,26,26,0.12)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] print:max-w-none print:rounded-none print:border print:shadow-none">
          <div className="bg-[linear-gradient(135deg,rgba(139,26,26,0.1),rgba(184,146,64,0.08))] px-6 py-8 sm:px-10 sm:py-9">
            <div className="flex items-center gap-4">
              <Image
                id="print-logo"
                src="/hawklife-hawk.png"
                alt="HawkLife logo"
                width={72}
                height={72}
                className="h-[56px] w-[56px] object-contain sm:h-[72px] sm:w-[72px]"
                priority
              />
              <div>
                <div className="text-[30px] font-bold leading-none tracking-[-0.06em] sm:text-[34px]">
                  Hawk<span className="text-[#8b1a1a]">Life</span>
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b6f67] sm:text-[11px]">
                  St. Joseph&apos;s Preparatory School
                </div>
              </div>
            </div>

            <p className="mt-7 text-[12px] font-bold uppercase tracking-[0.22em] text-[#8b1a1a]">
              {typeLabel} Attendance
            </p>
            <h1 className="mt-3 text-balance font-serif text-[2.25rem] leading-tight tracking-[-0.06em] sm:text-[3rem]">
              {attendanceSession.title}
            </h1>
            <div className="mt-4 inline-flex items-center rounded-full border border-[rgba(22,19,17,0.1)] bg-white/90 px-4 py-2 text-[12px] font-semibold text-[#5b514b] sm:text-[13px]">
              Flex Block · Static QR for room display
            </div>
          </div>

          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <div className="mx-auto w-full max-w-[430px] rounded-[32px] border border-[rgba(22,19,17,0.08)] bg-white p-4 shadow-[0_18px_52px_rgba(15,23,42,0.08)] sm:p-[22px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="print-qr"
                src={buildQrImageUrl(qrValue)}
                alt={`QR code for ${attendanceSession.title}`}
                className="block aspect-square w-full"
              />
            </div>
            <p className="mx-auto mt-6 max-w-[520px] text-[14px] leading-7 text-[#5f5650] sm:text-[15px]">
              Students should open HawkLife, join the correct flex block, and then scan this code when they arrive.
            </p>
            <div className="mt-7 inline-flex items-center rounded-full bg-[rgba(139,26,26,0.08)] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b1a1a]">
              Live HawkLife Attendance
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
