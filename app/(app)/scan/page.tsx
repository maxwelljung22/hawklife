import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { QrScanner } from "@/components/attendance/qr-scanner";

export const metadata = { title: "Scan QR" };

export default async function ScanPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  return <QrScanner />;
}
