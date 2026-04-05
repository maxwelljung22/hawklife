import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isV4Enabled } from "@/lib/feature-flags";
import { ComingSoonLock } from "@/components/attendance/coming-soon-lock";
import { QrScanner } from "@/components/attendance/qr-scanner";

export const metadata = { title: "Scan QR" };

export default async function ScanPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  if (!isV4Enabled()) {
    return (
      <ComingSoonLock
        eyebrow="QR attendance is coming in v4.0.0"
        title="QR check-in is staying under wraps."
        description="We&apos;re holding scan-based attendance for the full HawkLife v4.0.0 release so flex, attendance, and mobile check-in all launch together."
      />
    );
  }

  return <QrScanner />;
}
