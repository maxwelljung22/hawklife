import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccessFacultyTools } from "@/lib/roles";
import { ComingSoonLock } from "@/components/attendance/coming-soon-lock";

export const metadata = { title: "Create Session" };

export default async function FacultyCreateSessionPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  if (!canAccessFacultyTools(session.user.role)) redirect("/dashboard");

  return (
    <ComingSoonLock
      eyebrow="Faculty preview paused"
      title="Create Session is coming soon in HawkLife v4.0.0"
      description="We&apos;re temporarily locking session creation while we finish the final faculty workflow, attendance polish, and mobile details for the full v4.0.0 release."
    />
  );
}
