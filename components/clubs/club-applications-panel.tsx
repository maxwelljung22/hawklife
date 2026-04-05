"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Clock, Plus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  reviewClubApplication,
  saveClubApplicationForm,
  submitApplication,
} from "@/app/(app)/clubs/[slug]/actions";
import { useToast } from "@/hooks/use-toast";
import { cn, formatRelativeTime } from "@/lib/utils";

type Props = {
  club: {
    id: string;
    name: string;
    requiresApp: boolean;
  };
  isLeader: boolean;
  currentApplication: any | null;
  appForm: any | null;
  applications: any[];
};

type AppField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "email" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
};

type BuilderState = {
  enabled: boolean;
  isOpen: boolean;
  deadline: string;
  maxSlots: string;
  fields: AppField[];
};

const STATUS_CONFIG = {
  SUBMITTED: { icon: Clock, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Submitted" },
  UNDER_REVIEW: { icon: AlertCircle, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Under Review" },
  ACCEPTED: { icon: CheckCircle, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30", label: "Accepted" },
  REJECTED: { icon: XCircle, color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/30", label: "Not Accepted" },
  WAITLISTED: { icon: AlertCircle, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/30", label: "Waitlisted" },
} as const;

function normalizeFields(fields: any): AppField[] {
  if (!Array.isArray(fields)) return [];
  return fields.map((field: any, index: number) => ({
    id: String(field?.id ?? `field-${index + 1}`),
    label: String(field?.label ?? ""),
    type: ["text", "textarea", "email", "select"].includes(field?.type) ? field.type : "text",
    required: Boolean(field?.required),
    placeholder: field?.placeholder ? String(field.placeholder) : "",
    options: Array.isArray(field?.options) ? field.options.map((option: unknown) => String(option)) : [],
  }));
}

export function ClubApplicationsPanel({
  club,
  isLeader,
  currentApplication,
  appForm,
  applications,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>(
    Object.fromEntries(applications.map((application) => [application.id, application.reviewNotes ?? ""]))
  );
  const [builder, setBuilder] = useState<BuilderState>(() => ({
    enabled: club.requiresApp,
    isOpen: appForm?.isOpen ?? true,
    deadline: appForm?.deadline ? new Date(appForm.deadline).toISOString().slice(0, 16) : "",
    maxSlots: appForm?.maxSlots ? String(appForm.maxSlots) : "",
    fields: normalizeFields(appForm?.fields).length
      ? normalizeFields(appForm?.fields)
      : [
          {
            id: "why-join",
            label: "Why do you want to join?",
            type: "textarea",
            required: true,
            placeholder: "Tell us why this club is a fit for you.",
            options: [],
          } satisfies AppField,
        ],
  }));

  const fields = useMemo(() => normalizeFields(appForm?.fields), [appForm?.fields]);
  const fieldLabels = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.id, field.label])),
    [fields]
  );

  const statusConfig = currentApplication
    ? STATUS_CONFIG[currentApplication.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.SUBMITTED
    : null;

  const submitMemberApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submitApplication(club.id, responses);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Application submitted" });
    startTransition(() => router.refresh());
  };

  const saveForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await saveClubApplicationForm(club.id, builder);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Application settings saved" });
    startTransition(() => router.refresh());
  };

  const updateStatus = async (applicationId: string, status: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "WAITLISTED") => {
    const result = await reviewClubApplication(applicationId, status, reviewNotes[applicationId] ?? "");
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Application ${STATUS_CONFIG[status].label.toLowerCase()}` });
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
        className="surface-panel rounded-[1.75rem] p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Applications</p>
        <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
          {club.requiresApp ? "Apply to join" : "Application access"}
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          {club.requiresApp
            ? "Competitive or selective clubs can collect applications and give applicants a clear status."
            : "This club is currently open join, but leaders can turn on applications and publish a custom form below."}
        </p>

        {currentApplication ? (
          <div className={cn("mt-6 rounded-[1.5rem] border border-border/80 p-5", statusConfig?.bg)}>
            <div className="flex items-start gap-3">
              {statusConfig ? <statusConfig.icon className={cn("mt-0.5 h-5 w-5", statusConfig.color)} /> : null}
              <div>
                <p className={cn("text-[0.98rem] font-semibold", statusConfig?.color)}>{statusConfig?.label}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Submitted {formatRelativeTime(currentApplication.createdAt)}
                </p>
                {currentApplication.reviewNotes ? (
                  <p className="mt-3 text-[13px] leading-6 text-foreground/75">{currentApplication.reviewNotes}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : club.requiresApp && appForm?.isOpen ? (
          <form onSubmit={submitMemberApplication} className="mt-6 space-y-4">
            <div className="rounded-[1.3rem] border border-border/80 bg-background/75 p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Window</p>
              <p className="mt-2 text-[13.5px] leading-6 text-foreground/78">
                {appForm.deadline ? `Deadline: ${format(new Date(appForm.deadline), "MMMM d, yyyy 'at' h:mm a")}` : "Applications are currently open."}
              </p>
              {appForm.maxSlots ? (
                <p className="mt-1 text-[12px] text-muted-foreground">{appForm.maxSlots} available spots</p>
              ) : null}
            </div>

            {fields.length === 0 ? (
              <div className="rounded-[1.3rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
                <p className="text-[0.98rem] font-medium text-foreground">Application form is not ready yet</p>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">A club leader still needs to publish the questions.</p>
              </div>
            ) : (
              <>
                {fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-[12.5px] font-semibold text-foreground/80">
                      {field.label}
                      {field.required ? <span className="ml-1 text-[hsl(var(--primary))]">*</span> : null}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={4}
                        required={field.required}
                        value={responses[field.id] ?? ""}
                        onChange={(event) => setResponses((current) => ({ ...current, [field.id]: event.target.value }))}
                        placeholder={field.placeholder ?? ""}
                        className="w-full rounded-[1.1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={responses[field.id] ?? ""}
                        onChange={(event) => setResponses((current) => ({ ...current, [field.id]: event.target.value }))}
                        className="w-full rounded-[1.1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                      >
                        <option value="">Select an option</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : "text"}
                        required={field.required}
                        value={responses[field.id] ?? ""}
                        onChange={(event) => setResponses((current) => ({ ...current, [field.id]: event.target.value }))}
                        placeholder={field.placeholder ?? ""}
                        className="w-full rounded-[1.1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  Submit application
                </button>
              </>
            )}
          </form>
        ) : (
          <div className="mt-6 rounded-[1.3rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
            <p className="text-[0.98rem] font-medium text-foreground">
              {club.requiresApp ? "Applications are closed right now" : "This club does not currently require applications"}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              {club.requiresApp ? "Check back later or contact club leadership for timing." : "If the club becomes selective later, leaders can publish a form here."}
            </p>
          </div>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18, delay: 0.03 } }}
        className="surface-panel rounded-[1.75rem] p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Leader tools</p>
            <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
              Manage applications
            </h2>
          </div>
        </div>

        {!isLeader ? (
          <div className="mt-5 rounded-[1.3rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
            <p className="text-[0.98rem] font-medium text-foreground">Leader access only</p>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Club leaders can create application questions and review applicants here.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <form onSubmit={saveForm} className="space-y-4 rounded-[1.5rem] border border-border/80 bg-background/75 p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-card px-4 py-3">
                  <input
                    type="checkbox"
                    checked={builder.enabled}
                    onChange={(event) => setBuilder((current) => ({ ...current, enabled: event.target.checked }))}
                    className="h-4 w-4 rounded accent-[hsl(var(--primary))]"
                  />
                  <span className="text-[13px] font-medium text-foreground">Require applications to join</span>
                </label>
                <label className="flex items-center gap-3 rounded-[1rem] border border-border bg-card px-4 py-3">
                  <input
                    type="checkbox"
                    checked={builder.isOpen}
                    onChange={(event) => setBuilder((current) => ({ ...current, isOpen: event.target.checked }))}
                    className="h-4 w-4 rounded accent-[hsl(var(--primary))]"
                  />
                  <span className="text-[13px] font-medium text-foreground">Open the application window</span>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="datetime-local"
                  value={builder.deadline}
                  onChange={(event) => setBuilder((current) => ({ ...current, deadline: event.target.value }))}
                  className="w-full rounded-[1.1rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                />
                <input
                  type="number"
                  min="1"
                  value={builder.maxSlots}
                  onChange={(event) => setBuilder((current) => ({ ...current, maxSlots: event.target.value }))}
                  placeholder="Available spots"
                  className="w-full rounded-[1.1rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                />
              </div>

              <div className="space-y-3">
                {builder.fields.map((field, index) => (
                  <div key={field.id} className="rounded-[1.2rem] border border-border bg-card p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                      <input
                        value={field.label}
                        onChange={(event) =>
                          setBuilder((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item
                            ),
                          }))
                        }
                        placeholder="Question label"
                        className="w-full rounded-[1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                      />
                      <select
                        value={field.type}
                        onChange={(event) =>
                          setBuilder((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, type: event.target.value as AppField["type"] } : item
                            ),
                          }))
                        }
                        className="w-full rounded-[1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long answer</option>
                        <option value="email">Email</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                    <input
                      value={field.placeholder ?? ""}
                      onChange={(event) =>
                        setBuilder((current) => ({
                          ...current,
                          fields: current.fields.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, placeholder: event.target.value } : item
                          ),
                        }))
                      }
                      placeholder="Placeholder text"
                      className="mt-3 w-full rounded-[1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                    />
                    {field.type === "select" ? (
                      <textarea
                        rows={3}
                        value={(field.options ?? []).join("\n")}
                        onChange={(event) =>
                          setBuilder((current) => ({
                            ...current,
                            fields: current.fields.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) }
                                : item
                            ),
                          }))
                        }
                        placeholder="One option per line"
                        className="mt-3 w-full rounded-[1rem] border border-border bg-background px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))]"
                      />
                    ) : null}
                    <div className="mt-3 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            setBuilder((current) => ({
                              ...current,
                              fields: current.fields.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, required: event.target.checked } : item
                              ),
                            }))
                          }
                          className="h-4 w-4 rounded accent-[hsl(var(--primary))]"
                        />
                        Required question
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBuilder((current) => ({
                            ...current,
                            fields: current.fields.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="text-[12px] font-medium text-rose-600 transition-colors hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setBuilder((current) => ({
                      ...current,
                      fields: [
                        ...current.fields,
                        {
                          id: `field-${Date.now()}`,
                          label: "",
                          type: "text" as const,
                          required: false,
                          placeholder: "",
                          options: [],
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add question
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  Save application setup
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-foreground">Applicants</h3>
                <span className="text-[12px] text-muted-foreground">{applications.length} total</span>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-[1.3rem] border border-dashed border-border bg-muted/35 px-5 py-8 text-center">
                  <p className="text-[0.98rem] font-medium text-foreground">No applications yet</p>
                  <p className="mt-2 text-[13px] leading-6 text-muted-foreground">Once students submit, you can review them here and update their status.</p>
                </div>
              ) : (
                applications.map((application) => {
                  const config = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.SUBMITTED;
                  const Icon = config.icon;

                  return (
                    <div key={application.id} className="rounded-[1.4rem] border border-border/80 bg-background/75 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[0.98rem] font-semibold text-foreground">{application.applicant.name}</p>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", config.bg, config.color)}>
                              <Icon className="h-3.5 w-3.5" />
                              {config.label}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-muted-foreground">{application.applicant.email}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">Submitted {formatRelativeTime(application.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateStatus(application.id, "UNDER_REVIEW")} className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted">
                            Review
                          </button>
                          <button type="button" onClick={() => updateStatus(application.id, "WAITLISTED")} className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted">
                            Waitlist
                          </button>
                          <button type="button" onClick={() => updateStatus(application.id, "ACCEPTED")} className="rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-500">
                            Accept
                          </button>
                          <button type="button" onClick={() => updateStatus(application.id, "REJECTED")} className="rounded-xl bg-rose-600 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-rose-500">
                            Decline
                          </button>
                        </div>
                      </div>

                      {application.responses ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {Object.entries(application.responses).map(([key, value]) => (
                            <div key={key} className="rounded-[1rem] border border-border bg-card p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{fieldLabels[key] ?? key}</p>
                              <p className="mt-2 text-[13px] leading-6 text-foreground/78">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <textarea
                        rows={3}
                        value={reviewNotes[application.id] ?? ""}
                        onChange={(event) => setReviewNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                        placeholder="Add optional review notes"
                        className="mt-4 w-full rounded-[1rem] border border-border bg-card px-4 py-3 text-[14px] outline-none transition-all duration-200 focus:border-[hsl(var(--ring))] focus:shadow-glow-crimson"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
