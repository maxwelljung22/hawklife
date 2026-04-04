import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ComingSoonLock } from "@/components/attendance/coming-soon-lock";

export const metadata = { title: "Flex Block" };

export default async function FlexPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  return (
    <ComingSoonLock
      eyebrow="Locked in preview"
      title="Flex Block is coming soon in HawkLife v4.0.0"
      description="We&apos;re holding back the Flex Block experience a little longer so the final launch feels smooth, fast, and polished across mobile and desktop."
    />
  );
}
