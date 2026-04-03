import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeCharterApplication } from "@/lib/charter";
import { CharterApplicationForm } from "@/components/charter/charter-application-form";

export const metadata = { title: "Charter Application" };
export const dynamic = "force-dynamic";

export default async function CharterApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/charter/apply");

  const latestApplication = await prisma.charterApplication.findFirst({
    where: { applicantId: session.user.id },
    orderBy: { updatedAt: "desc" },
  }).catch(() => null);

  return (
    <CharterApplicationForm
      initialValues={latestApplication ? serializeCharterApplication(latestApplication) : undefined}
      applicantName={session.user.name}
      applicantEmail={session.user.email}
    />
  );
}
