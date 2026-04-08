"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { createClub, updateClub } from "@/app/(app)/clubs/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["STEM", "HUMANITIES", "ARTS", "BUSINESS", "SERVICE", "SPORTS", "FAITH", "OTHER"];
const COMMITMENTS = ["LOW", "MEDIUM", "HIGH"];

const GRADIENT_PRESETS = [
  { from: "#1a3a6e", to: "#0c2a52", label: "Navy" },
  { from: "#8B1A1A", to: "#5c1010", label: "Crimson" },
  { from: "#0a3d2e", to: "#071f17", label: "Forest" },
  { from: "#2d1b6e", to: "#1a0a4a", label: "Violet" },
  { from: "#3d2b00", to: "#1f1600", label: "Bronze" },
  { from: "#1a1a2e", to: "#0d0d1a", label: "Midnight" },
  { from: "#6a1c1c", to: "#3d0f0f", label: "Burgundy" },
  { from: "#1b4332", to: "#0a2218", label: "Emerald" },
] as const;

const MEETING_DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

type ClubEditorValues = {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string;
  emoji: string;
  tagline: string;
  description: string;
  category: string;
  commitment: string;
  meetingDay: string;
  meetingTime: string;
  meetingRoom: string;
  requiresApp: boolean;
  tags: string[];
  gradientFrom: string;
  gradientTo: string;
};

interface ClubEditorClientProps {
  mode: "create" | "edit";
  initialValues: ClubEditorValues;
}

export function ClubEditorClient({ mode, initialValues }: ClubEditorClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialValues);
  const [newTag, setNewTag] = useState("");
  const meetingDayPreset = MEETING_DAY_OPTIONS.includes(form.meetingDay as (typeof MEETING_DAY_OPTIONS)[number]) ? form.meetingDay : "Other";

  const set = (k: keyof ClubEditorValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createClub(form)
          : await updateClub(form.id!, form);

      if (result?.error) {
        toast({
          title: mode === "create" ? "Failed to create club" : "Failed to update club",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: mode === "create" ? `${form.emoji} ${form.name} created!` : `${form.emoji} ${form.name} updated!`,
      });

      router.push(mode === "create" ? `/clubs/${result?.slug ?? ""}` : `/clubs/${result?.slug ?? ""}`);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <div className="rounded-[32px] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(176,20,32,.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.96))] p-5 shadow-[0_24px_72px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(176,20,32,.12),transparent_32%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(10,10,10,0.95))] sm:p-7 md:p-8">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
        </Link>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[.10em] text-crimson">Administration</p>
            <h1 className="font-display text-[32px] font-semibold tracking-tight text-foreground">
              {mode === "create" ? "Create a New Club" : "Edit Club"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Keep the details crisp, the presentation strong, and the club card visually on-brand for students.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[28px] overflow-hidden border border-border shadow-card">
            <div className="relative flex h-28 items-end pb-3 pl-4" style={{ background: `linear-gradient(135deg, ${form.gradientFrom}, ${form.gradientTo})` }}>
              <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-[72%] items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/15 bg-black/15 text-5xl backdrop-blur-sm">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt={`${form.name || "Club"} logo`} className="h-full w-full object-cover" />
                ) : (
                  form.emoji
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50" />
              <span className="relative rounded-full border border-white/15 bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
                {form.category.charAt(0) + form.category.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="bg-card px-4 py-3">
              <p className="font-display text-[16px] font-semibold text-foreground">{form.name || "Club Name"}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{form.description || "Club description will appear here."}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:gap-8">
        <div className="space-y-7">
          <Section label="Basic Information">
            <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
              <Field label="Emoji">
                <input value={form.emoji} onChange={set("emoji")} className="w-full rounded-2xl border border-border bg-muted px-3 py-3 text-center text-2xl outline-none transition-all focus:border-border focus:bg-card focus:ring-2 focus:ring-crimson/10" maxLength={2} />
              </Field>
              <Field label="Club Name *">
                <input required value={form.name} onChange={set("name")} placeholder="e.g. Model United Nations" className={inputCls} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL Slug *">
                <input required value={form.slug} onChange={set("slug")} placeholder="model-united-nations" className={inputCls} />
              </Field>
              <Field label="Logo URL">
                <input value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://..." className={inputCls} />
              </Field>
            </div>

            <Field label="Tagline">
              <input value={form.tagline} onChange={set("tagline")} placeholder="One-line description shown on the club card" className={inputCls} maxLength={80} />
            </Field>

            <Field label="Full Description *">
              <textarea required value={form.description} onChange={set("description")} placeholder="Describe what this club does, who it's for, and what members can expect." rows={5} className={cn(inputCls, "resize-none py-3")} />
            </Field>
          </Section>

          <Section label="Classification">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select value={form.category} onChange={set("category")} className={selectCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Commitment Level">
                <select value={form.commitment} onChange={set("commitment")} className={selectCls}>
                  {COMMITMENTS.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Tags">
              <div className="mb-2 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground/70">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag (e.g. competitive, service)"
                  className={cn(inputCls, "flex-1")}
                />
                <button type="button" onClick={addTag} className="rounded-2xl bg-muted px-4 py-3 text-[13px] font-medium hover:bg-muted/70 transition-colors">
                  Add
                </button>
              </div>
            </Field>
          </Section>

          <Section label="Meeting Schedule">
            <div className="rounded-[24px] border border-border bg-muted/40 p-4">
              <p className="text-[13px] font-semibold text-foreground">Meeting Schedule</p>
              <p className="mt-2 text-[12px] leading-6 text-muted-foreground">
                Choose the main weekday for this club. If the schedule rotates or changes, use the custom option and describe it clearly for students.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
                {MEETING_DAY_OPTIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, meetingDay: day }))}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-[12.5px] font-medium transition-colors",
                      meetingDayPreset === day
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {day}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, meetingDay: current.meetingDay && meetingDayPreset === "Other" ? current.meetingDay : "" }))}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-[12.5px] font-medium transition-colors",
                    meetingDayPreset === "Other"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  Other
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label={meetingDayPreset === "Other" ? "Custom day / cadence" : "Selected day"}>
                <input
                  value={form.meetingDay}
                  onChange={set("meetingDay")}
                  placeholder={meetingDayPreset === "Other" ? "e.g. Tuesdays & Thursdays, rotating by project" : "Selected weekday"}
                  className={inputCls}
                />
              </Field>
              <Field label="Time">
                <input value={form.meetingTime} onChange={set("meetingTime")} placeholder="e.g. 3:15 PM" className={inputCls} />
              </Field>
              <Field label="Room">
                <input value={form.meetingRoom} onChange={set("meetingRoom")} placeholder="e.g. Science Lab 214" className={inputCls} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-7">
          <Section label="Club Color">
            <p className="mb-3 text-[12px] text-muted-foreground">Choose a gradient that feels consistent with the club&apos;s identity.</p>
            <div className="grid grid-cols-2 gap-3">
              {GRADIENT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, gradientFrom: p.from, gradientTo: p.to }))}
                  className={cn(
                    "group overflow-hidden rounded-[20px] border p-1 text-left transition-all duration-200",
                    form.gradientFrom === p.from ? "border-crimson shadow-lg shadow-crimson/15" : "border-border hover:-translate-y-0.5 hover:shadow-card-hover"
                  )}
                >
                  <div className="h-20 rounded-[16px]" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />
                  <p className="px-2 pb-1 pt-2 text-[12px] font-medium text-foreground">{p.label}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section label="Options">
            <label className="flex cursor-pointer items-center gap-3 rounded-[22px] border border-border bg-card px-4 py-4">
              <input
                type="checkbox"
                checked={form.requiresApp}
                onChange={(e) => setForm((f) => ({ ...f, requiresApp: e.target.checked }))}
                className="h-4 w-4 rounded accent-crimson"
              />
              <div>
                <p className="text-[13.5px] font-medium text-foreground">Requires Application</p>
                <p className="text-[12px] text-muted-foreground">Students must apply before they can join this club.</p>
              </div>
            </label>
          </Section>

          <div className="rounded-[28px] border border-border bg-card p-5 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[.08em] text-muted-foreground">Publishing Notes</p>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-muted-foreground">
              <li>Keep the tagline concise so it fits cleanly on the directory card.</li>
              <li>Clear meeting info helps students decide quickly.</li>
              <li>Tags improve discovery in search and filtering.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Link href="/admin" className="rounded-2xl border border-border px-5 py-3 text-center text-[13.5px] font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || !form.name.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-crimson px-6 py-3 text-[13.5px] font-medium text-white shadow-lg shadow-crimson/20 transition-all hover:bg-crimson/90 disabled:opacity-50"
            >
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {isPending ? (mode === "create" ? "Creating…" : "Saving…") : (mode === "create" ? "Create Club" : "Save Changes")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-muted px-4 py-3 text-[13.5px] outline-none transition-all placeholder:text-muted-foreground focus:border-border focus:bg-card focus:ring-2 focus:ring-crimson/10";
const selectCls = "w-full rounded-2xl border border-border bg-muted px-4 py-3 text-[13.5px] outline-none transition-all focus:border-border focus:bg-card";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-card">
      <p className="mb-4 border-b border-border pb-3 text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground/70">{label}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12.5px] font-semibold text-foreground/80">{label}</label>
      {children}
    </div>
  );
}
