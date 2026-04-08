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
    <main className="min-h-screen bg-[#f8f4ef] text-[#161311] print:min-h-0 print:bg-white">
      <QrPrintClient />
      <style>{`
        @page {
          size: letter portrait;
          margin: 0.35in;
        }
      `}</style>
      <div className="mx-auto flex min-h-screen max-w-[8.2in] items-center justify-center px-4 py-6 print:block print:min-h-0 print:max-w-none print:px-0 print:py-0">
        <section className="w-full overflow-hidden rounded-[32px] border border-[rgba(139,26,26,0.12)] bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] print:rounded-[24px] print:border-[rgba(22,19,17,0.14)] print:shadow-none">
          <div className="bg-[linear-gradient(135deg,rgba(139,26,26,0.1),rgba(184,146,64,0.08))] px-6 py-6 sm:px-8 sm:py-7 print:px-7 print:py-6">
            <div className="flex items-center gap-3">
              <Image
                id="print-logo"
                src="/hawklife-hawk.png"
                alt="HawkLife logo"
                width={64}
                height={64}
                className="h-[52px] w-[52px] object-contain print:h-[50px] print:w-[50px]"
                priority
              />
              <div>
                <div className="text-[28px] font-bold leading-none tracking-[-0.06em] print:text-[26px]">
                  Hawk<span className="text-[#8b1a1a]">Life</span>
                </div>
                <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#7b6f67] print:text-[9px]">
                  St. Joseph&apos;s Preparatory School
                </div>
              </div>
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b1a1a] print:mt-5 print:text-[10px]">
              {typeLabel} Attendance
            </p>
            <h1 className="mt-2 text-balance font-serif text-[2.15rem] leading-tight tracking-[-0.06em] sm:text-[2.6rem] print:text-[2rem]">
              {attendanceSession.title}
            </h1>
            <div className="mt-4 inline-flex items-center rounded-full border border-[rgba(22,19,17,0.1)] bg-white/90 px-4 py-2 text-[12px] font-semibold text-[#5b514b] print:mt-3 print:px-3.5 print:py-1.5 print:text-[11px]">
              Flex Block · Static QR for room display
            </div>
          </div>

          <div className="px-6 py-6 text-center sm:px-8 sm:py-8 print:px-7 print:py-6">
            <div className="mx-auto w-full max-w-[4.35in] rounded-[28px] border border-[rgba(22,19,17,0.08)] bg-white p-4 shadow-[0_18px_52px_rgba(15,23,42,0.08)] print:max-w-[4.6in] print:rounded-[24px] print:p-3 print:shadow-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="print-qr"
                src={buildQrImageUrl(qrValue)}
                alt={`QR code for ${attendanceSession.title}`}
                className="block aspect-square w-full"
              />
            </div>
            <p className="mx-auto mt-5 max-w-[5.4in] text-[13.5px] leading-6 text-[#5f5650] print:mt-4 print:max-w-[5.7in] print:text-[12px] print:leading-5">
              Students should open HawkLife, join the correct flex block, and then scan this code when they arrive.
            </p>
            <div className="mt-6 inline-flex items-center rounded-full bg-[rgba(139,26,26,0.08)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b1a1a] print:mt-5 print:px-3.5 print:py-1.5 print:text-[10px]">
              Live HawkLife Attendance
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
