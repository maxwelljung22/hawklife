"use client";

import { CHARTER_CATEGORY_OPTIONS, type CharterFormValues } from "@/lib/charter";
import { Button } from "@/components/ui/button";

interface CharterReviewProps {
  values: CharterFormValues;
  onEditStep: (step: number) => void;
}

function SummarySection({
  title,
  description,
  children,
  onEdit,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="mt-5 space-y-4 text-sm text-neutral-700 dark:text-neutral-200">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 md:grid-cols-[180px_1fr] md:gap-4">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">{label}</span>
      <div>{value}</div>
    </div>
  );
}

export function CharterReview({ values, onEditStep }: CharterReviewProps) {
  return (
    <div className="space-y-5">
      <SummarySection title="Club Basics" description="Identity, positioning, and mission." onEdit={() => onEditStep(0)}>
        <SummaryRow label="Club name" value={<p className="font-medium text-neutral-950 dark:text-white">{values.clubName}</p>} />
        <SummaryRow
          label="Category"
          value={<p>{CHARTER_CATEGORY_OPTIONS.find((option) => option.value === values.category)?.label ?? values.category}</p>}
        />
        <SummaryRow label="Mission" value={<p className="leading-7">{values.missionStatement}</p>} />
      </SummarySection>

      <SummarySection title="Leadership" description="Founders and the leadership bench." onEdit={() => onEditStep(1)}>
        <SummaryRow label="Founder" value={<p>{values.founderName}</p>} />
        <SummaryRow
          label="Co-founders"
          value={
            <div className="flex flex-wrap gap-2">
              {values.coFounders.filter(Boolean).map((name) => (
                <span key={name} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                  {name}
                </span>
              ))}
            </div>
          }
        />
        <SummaryRow
          label="Roles"
          value={
            <div className="space-y-2">
              {values.leadershipRoles
                .filter((entry) => entry.title.trim() && entry.person.trim())
                .map((entry) => (
                  <div key={`${entry.title}-${entry.person}`} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="font-medium">{entry.title}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">{entry.person}</span>
                  </div>
                ))}
            </div>
          }
        />
      </SummarySection>

      <SummarySection title="Plan & Viability" description="Why this club should exist and how it will stay active." onEdit={() => onEditStep(2)}>
        <SummaryRow label="Need" value={<p className="leading-7">{values.whyExist}</p>} />
        <SummaryRow label="Differentiator" value={<p className="leading-7">{values.uniqueValue}</p>} />
        <SummaryRow
          label="Planned events"
          value={
            <ul className="space-y-2">
              {values.plannedEvents.filter(Boolean).map((event) => (
                <li key={event} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  {event}
                </li>
              ))}
            </ul>
          }
        />
      </SummarySection>

      <SummarySection title="Logistics" description="Cadence, scale, and support." onEdit={() => onEditStep(3)}>
        <SummaryRow label="Meeting cadence" value={<p>{values.meetingFrequency}</p>} />
        <SummaryRow label="Expected members" value={<p>{values.expectedMemberCount}</p>} />
        <SummaryRow label="Advisor" value={<p>{values.advisorName || "No advisor named yet"}</p>} />
        {values.advisorEmail ? <SummaryRow label="Advisor email" value={<p>{values.advisorEmail}</p>} /> : null}
      </SummarySection>
    </div>
  );
}
