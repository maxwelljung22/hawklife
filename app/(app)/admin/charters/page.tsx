import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/roles";
import { CharterAdminDashboard } from "@/components/charter/charter-admin-dashboard";

export const metadata = { title: "Charter Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminChartersPage() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) redirect("/dashboard?error=unauthorized");

  const applications = await prisma.charterApplication.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  }).catch(() => []);

  return <CharterAdminDashboard applications={applications} />;
}
