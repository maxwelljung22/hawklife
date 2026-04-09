"use client";

import { useState, useTransition } from "react";
import { CalendarDays, MapPin, Sparkles, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  createMinistryProgram,
  deleteMinistryProgram,
  toggleMinistryProgramRegistration,
} from "@/app/(app)/mission-ministry/actions";
import { cn } from "@/lib/utils";

type ProgramType = "SERVICE_OPPORTUNITY" | "KAIROS" | "RETREAT";

type PublisherProgram = {
  id: string;
  title: string;
  summary: string;
  type: ProgramType;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  capacity: number | null;
  signupCount: number;
  registrationOpen: boolean;
  isFeatured: boolean;
  colorFrom: string;
  colorTo: string;
};

const PROGRAM_LABELS: Record<ProgramType, string> = {
  SERVICE_OPPORTUNITY: "Service Opportunity",
  KAIROS: "Kairos",
  RETREAT: "Retreat",
};

const GLASS_PANEL =
  "border border-[rgba(122,87,31,0.18)] bg-[linear-gradient(145deg,rgba(255,251,245,0.92),rgba(255,244,231,0.78))] shadow-[0_18px_50px_rgba(36,24,18,0.08)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(22,18,33,0.94),rgba(14,18,34,0.88))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]";
const INSET_PANEL =
  "border border-[rgba(122,87,31,0.14)] bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(248,236,220,0.68))] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(31,24,43,0.9),rgba(17,21,37,0.86))]";
const SOFT_BADGE =
  "border border-[rgba(255,255,255,0.45)] bg-[rgba(255,250,243,0.78)] text-slate-900 dark:border-white/10 dark:bg-[rgba(24,28,45,0.88)] dark:text-white";

export function MinistryPublisher({ programs }: { programs: PublisherProgram[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    type: "SERVICE_OPPORTUNITY" as ProgramType,
    location: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    capacity: "",
    isFeatured: false,
    colorFrom: "#8B1A1A",
    colorTo: "#D97706",
    imageUrl: "",
  });

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createMinistryProgram(form);
      if ("error" in result) {
        toast({ title: "Couldn't publish program", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Program published" });
      setForm({
        title: "",
        summary: "",
        description: "",
        type: "SERVICE_OPPORTUNITY",
        location: "",
        startDate: "",
        endDate: "",
        registrationDeadline: "",
        capacity: "",
        isFeatured: false,
        colorFrom: "#8B1A1A",
        colorTo: "#D97706",
        imageUrl: "",
      });
    });
  };

  const handleDelete = (programId: string) => {
    startTransition(async () => {
      const result = await deleteMinistryProgram(programId);
      if ("error" in result) {
        toast({ title: "Couldn't delete program", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Program removed" });
    });
  };

  const handleToggleOpen = (programId: string, registrationOpen: boolean) => {
    startTransition(async () => {
      const result = await toggleMinistryProgramRegistration(programId, registrationOpen);
      if ("error" in result) {
        toast({ title: "Couldn't update registration", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: registrationOpen ? "Registration reopened" : "Registration closed" });
    });
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-[rgba(122,87,31,0.2)] bg-[linear-gradient(135deg,rgba(123,31,43,0.92),rgba(142,83,24,0.88),rgba(34,57,102,0.86))] p-6 shadow-[0_30px_90px_rgba(25,17,12,0.18)] sm:p-8 dark:border-[rgba(240,214,158,0.12)] dark:bg-[linear-gradient(135deg,rgba(48,16,28,0.98),rgba(79,43,17,0.96),rgba(17,27,58,0.96))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,243,214,0.34),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%),linear-gradient(90deg,transparent_0%,rgba(255,220,160,0.08)_48%,transparent_100%)]" />
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            {["Prayer", "Formation", "Service"].map((item) => (
              <span key={item} className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", SOFT_BADGE)}>
                {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/72">Mission & Ministry Staff</p>
          <h1 className="mt-3 text-[clamp(2.1rem,5vw,3.8rem)] font-semibold tracking-[-0.06em] text-white">Publish Mission & Ministry programs</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
            Create service opportunities, Kairos openings, and retreat sign-ups from one cleaner staff workspace instead of the student-facing page.
          </p>
        </div>
      </section>

      <section className={cn("rounded-[32px] p-5 sm:p-6", GLASS_PANEL)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New program</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Create something students can sign up for</h2>
          </div>
          <div className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium text-foreground/70 dark:text-white/70", INSET_PANEL)}>
            Visible to Mission & Ministry staff only
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Program title" />
          <Input value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Short summary" />
          <div className="lg:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the experience, expectations, transportation details, and anything students should know before signing up."
              rows={5}
              className="w-full rounded-[24px] border border-neutral-200 bg-[rgba(255,255,255,0.85)] px-4 py-3 text-sm text-neutral-950 outline-none transition-all duration-200 focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-[rgba(18,22,39,0.92)] dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
            />
          </div>
          <select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ProgramType }))}
            className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition-all duration-200 focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
          >
            {Object.entries(PROGRAM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
          <Input type="datetime-local" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
          <Input type="datetime-local" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
          <Input type="datetime-local" value={form.registrationDeadline} onChange={(event) => setForm((current) => ({ ...current, registrationDeadline: event.target.value }))} />
          <Input type="number" min={1} max={500} value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} placeholder="Capacity (optional)" />
          <Input value={form.colorFrom} onChange={(event) => setForm((current) => ({ ...current, colorFrom: event.target.value }))} placeholder="#8B1A1A" />
          <Input value={form.colorTo} onChange={(event) => setForm((current) => ({ ...current, colorTo: event.target.value }))} placeholder="#D97706" />
          <div className="lg:col-span-2">
            <Input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Optional https image URL" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Feature this on the top of the dashboard
          </label>

          <Button size="lg" className="w-full sm:w-auto sm:min-w-[220px]" onClick={handleCreate} disabled={isPending}>
            <Sparkles className="h-4 w-4" />
            Publish program
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Published now</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Active Mission & Ministry programs</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {programs.map((program) => (
            <article key={program.id} className={cn("overflow-hidden rounded-[30px] shadow-card", GLASS_PANEL)}>
              <div className="p-5 sm:p-6" style={{ backgroundImage: `linear-gradient(135deg, ${program.colorFrom}22, ${program.colorTo}1a)` }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", SOFT_BADGE)}>
                        {PROGRAM_LABELS[program.type]}
                      </span>
                      {program.isFeatured ? (
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", SOFT_BADGE)}>
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">{program.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-foreground/74 dark:text-white/72">{program.summary}</p>
                  </div>
                  <div className={cn("rounded-[22px] px-4 py-3 text-sm shadow-sm", INSET_PANEL)}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/52 dark:text-white/54">Sign-ups</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{program.signupCount}{program.capacity ? `/${program.capacity}` : ""}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-3 text-sm text-foreground/72 dark:text-white/70 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(program.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(program.startDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {program.location}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[12px] text-foreground/72 dark:text-white/70">
                  <span className={cn("rounded-full border px-3 py-1.5", program.registrationOpen ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300" : "border-border bg-muted")}>
                    {program.registrationOpen ? "Registration open" : "Registration closed"}
                  </span>
                  {program.registrationDeadline ? (
                    <span className={cn("rounded-full px-3 py-1.5", INSET_PANEL)}>
                      Deadline {new Date(program.registrationDeadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  ) : null}
                  <span className={cn("rounded-full px-3 py-1.5", INSET_PANEL)}>
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    {program.signupCount} signed up
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleToggleOpen(program.id, !program.registrationOpen)} disabled={isPending}>
                    {program.registrationOpen ? "Close registration" : "Reopen registration"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(program.id)} disabled={isPending}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}

          {programs.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-border bg-card p-8 text-center lg:col-span-2">
              <p className="text-base font-semibold text-foreground">Nothing published yet</p>
              <p className="mt-2 text-sm text-muted-foreground">The next service opportunity, Kairos date, or retreat can go live from this page.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
