import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket, ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ApplicationsClient } from "./applications-client";
import { isV4Enabled } from "@/lib/feature-flags";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  if (isV4Enabled()) {
    const [myApplications, openForms] = await Promise.all([
      prisma.application.findMany({
        where: { applicantId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { club: { select: { name: true, emoji: true, slug: true } } },
      }),
      prisma.appForm.findMany({
        where: {
          isOpen: true,
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          club: {
            isActive: true,
            NOT: { applications: { some: { applicantId: session.user.id } } },
          },
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              emoji: true,
              slug: true,
              description: true,
              gradientFrom: true,
              gradientTo: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return <ApplicationsClient myApplications={myApplications as any} openForms={openForms as any} />;
  }

  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-4xl items-center justify-center py-10 sm:py-16">
      <div className="w-full overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(139,26,26,0.10),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))/0.10] text-[hsl(var(--primary))]">
            <Rocket className="h-5 w-5" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Applications</p>
          <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.06em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
            Coming soon in v4.0.0
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            We&apos;re locking club applications while we finish the full v4.0.0 release. Application setup, submission, and status tracking will return in a more polished rollout.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="rounded-[1.5rem] border border-border/80 bg-background/70 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <p className="mt-3 text-[1.05rem] font-semibold text-foreground">Applications are temporarily locked.</p>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              You can still browse clubs normally while the applications experience is being finalized.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to clubs
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
