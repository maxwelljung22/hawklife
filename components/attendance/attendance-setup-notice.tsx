import Link from "next/link";
import { AlertTriangle, DatabaseZap } from "lucide-react";

export function AttendanceSetupNotice({
  title = "Attendance setup needed",
  description = "The Hawk Attendance System code is deployed, but the database is still missing the latest attendance columns.",
  eyebrow = "Hawk Attendance System",
  migrationHint = "Apply the migration for the new attendance schema, then redeploy or refresh the page. The checked-in file is `prisma/migrations/20260404133000_unify_flex_attendance/migration.sql`.",
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
  migrationHint?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center justify-center py-10 sm:py-16">
      <div className="surface-card w-full rounded-[32px] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.10)] text-[hsl(var(--primary))]">
            <DatabaseZap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">{description}</p>
            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{migrationHint}</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Back to dashboard
              </Link>
              <Link
                href="/changelog"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                View updates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
