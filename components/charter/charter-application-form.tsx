"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Sparkles, ArrowLeft, ArrowRight, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  calculateCharterStrength,
  CHARTER_CATEGORY_OPTIONS,
  CHARTER_MEETING_OPTIONS,
  CHARTER_STEPS,
  EMPTY_CHARTER_FORM,
  type CharterFormValues,
} from "@/lib/charter";
import { CharterProgress } from "./charter-progress";
import { CharterReview } from "./charter-review";
import { submitCharterApplication } from "@/app/(app)/charter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  initialValues?: CharterFormValues;
  applicantName?: string | null;
  applicantEmail?: string | null;
};

const TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

function Field({
  label,
  description,
  required,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">{label}</span>
        {required ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">Required</span> : null}
      </div>
      {description ? <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p> : null}
      {children}
    </label>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 dark:text-white">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500 dark:text-neutral-400">{description}</p>
        </div>
        <div className="hidden rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-right dark:border-neutral-800 dark:bg-neutral-900 md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Review signal</p>
          <p className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">Clear, concise, specific</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function CharterApplicationForm({ initialValues, applicantName, applicantEmail }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<CharterFormValues>(() => ({
    ...EMPTY_CHARTER_FORM,
    founderName: applicantName ?? EMPTY_CHARTER_FORM.founderName,
    ...initialValues,
  }));

  const strength = useMemo(() => calculateCharterStrength(values), [values]);

  const updateField = <K extends keyof CharterFormValues>(field: K, value: CharterFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const updateArrayValue = (field: "coFounders" | "plannedEvents", index: number, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addArrayValue = (field: "coFounders" | "plannedEvents") => {
    setValues((current) => ({ ...current, [field]: [...current[field], ""] }));
  };

  const removeArrayValue = (field: "coFounders" | "plannedEvents", index: number) => {
    setValues((current) => ({
      ...current,
      [field]: current[field].length === 1 ? current[field] : current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateRoleValue = (index: number, key: "title" | "person", value: string) => {
    setValues((current) => ({
      ...current,
      leadershipRoles: current.leadershipRoles.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [key]: value } : entry
      ),
    }));
  };

  const addRole = () => {
    setValues((current) => ({
      ...current,
      leadershipRoles: [...current.leadershipRoles, { title: "", person: "" }],
    }));
  };

  const removeRole = (index: number) => {
    setValues((current) => ({
      ...current,
      leadershipRoles:
        current.leadershipRoles.length === 1
          ? current.leadershipRoles
          : current.leadershipRoles.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      if (!values.clubName.trim() || values.missionStatement.trim().length < 40) return "Add a club name and a fuller mission statement.";
    }
    if (index === 1) {
      const validRoles = values.leadershipRoles.filter((entry) => entry.title.trim() && entry.person.trim());
      if (!values.founderName.trim() || validRoles.length < 2) return "Name the founder and at least one additional leadership role.";
    }
    if (index === 2) {
      if (values.whyExist.trim().length < 80 || values.uniqueValue.trim().length < 60 || values.plannedEvents.filter(Boolean).length < 2) {
        return "Show a stronger case for why the club matters and list at least two planned events.";
      }
    }
    if (index === 3) {
      if (!values.meetingFrequency.trim() || Number(values.expectedMemberCount) < 5) return "Set a meeting cadence and a realistic member count of at least 5.";
      if (values.advisorEmail && !values.advisorEmail.includes("@")) return "Advisor email needs to look valid.";
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) {
      toast({ title: "Almost there", description: error, variant: "destructive" });
      return;
    }
    setStep((current) => Math.min(current + 1, CHARTER_STEPS.length - 1));
  };

  const submit = () => {
    const error = validateStep(3);
    if (error) {
      toast({ title: "Complete the essentials", description: error, variant: "destructive" });
      setStep(3);
      return;
    }

    startTransition(async () => {
      const result = await submitCharterApplication(values);
      if (result?.error) {
        toast({ title: "Couldn’t submit charter", description: result.error, variant: "destructive" });
        return;
      }

      toast({
        title: "Application submitted",
        description: "Your charter is now in the admin review queue.",
      });

      if (result?.applicationId) {
        setValues((current) => ({ ...current, id: result.applicationId }));
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0, transition: TRANSITION }}>
        <div className="mb-8 overflow-hidden rounded-[36px] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,.14),transparent_30%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(10,10,10,0.96))] md:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-400">
                <Sparkles className="h-3.5 w-3.5" />
                New charter request
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-neutral-950 dark:text-white md:text-[3.3rem]">
                Launch a club proposal with clarity.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500 dark:text-neutral-400">
                Build a compelling case, move one step at a time, and submit a charter the admin team can review quickly.
              </p>
            </div>
            <div className="rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-neutral-950/90">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Applicant</p>
              <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">{applicantName}</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{applicantEmail}</p>
            </div>
          </div>
        </div>

        <CharterProgress currentStep={step} strength={strength} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0, transition: TRANSITION }}
            exit={{ opacity: 0, x: -16, y: -6, transition: { duration: 0.2 } }}
          >
            {step === 0 ? (
              <StepShell eyebrow="Step 1" title="Club Basics" description="Define the club with confidence. Keep the positioning crisp and the mission easy to understand.">
                <Field label="Club name" description="Use a name students will recognize instantly." required>
                  <Input value={values.clubName} onChange={(event) => updateField("clubName", event.target.value)} />
                </Field>
                <Field label="Category" description="Pick the lane the club will naturally live in." required>
                  <select
                    value={values.category}
                    onChange={(event) => updateField("category", event.target.value as CharterFormValues["category"])}
                    className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 transition-all duration-200 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
                  >
                    {CHARTER_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mission statement" description="Explain what the club exists to do in a way that feels memorable and concrete." required>
                  <Textarea value={values.missionStatement} onChange={(event) => updateField("missionStatement", event.target.value)} />
                </Field>
              </StepShell>
            ) : null}

            {step === 1 ? (
              <StepShell eyebrow="Step 2" title="Leadership" description="Strong club applications show ownership. Make the leadership structure feel credible from day one.">
                <Field label="Founder" description="Who will own the launch and be accountable for momentum?" required>
                  <Input value={values.founderName} onChange={(event) => updateField("founderName", event.target.value)} />
                </Field>
                <Field label="Co-founders" description="Add the students helping launch the club.">
                  <div className="space-y-3">
                    {values.coFounders.map((value, index) => (
                      <div key={`cofounder-${index}`} className="flex items-center gap-3">
                        <Input value={value} onChange={(event) => updateArrayValue("coFounders", index, event.target.value)} />
                        <Button type="button" variant="secondary" size="sm" onClick={() => removeArrayValue("coFounders", index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => addArrayValue("coFounders")} className="justify-start px-0">
                      <Plus className="h-4 w-4" />
                      Add co-founder
                    </Button>
                  </div>
                </Field>
                <Field label="Leadership roles" description="Map the early team clearly. Applications feel stronger when responsibility is distributed." required>
                  <div className="space-y-3">
                    {values.leadershipRoles.map((entry, index) => (
                      <div key={`role-${index}`} className="grid gap-3 rounded-[26px] border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 md:grid-cols-[1fr_1fr_auto]">
                        <Input value={entry.title} onChange={(event) => updateRoleValue(index, "title", event.target.value)} />
                        <Input value={entry.person} onChange={(event) => updateRoleValue(index, "person", event.target.value)} />
                        <Button type="button" variant="secondary" size="sm" onClick={() => removeRole(index)} className="self-center">
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={addRole} className="justify-start px-0">
                      <Plus className="h-4 w-4" />
                      Add leadership role
                    </Button>
                  </div>
                </Field>
              </StepShell>
            ) : null}

            {step === 2 ? (
              <StepShell eyebrow="Step 3" title="Plan & Viability" description="This is where the proposal wins trust. Be specific about demand, differentiation, and how the club will stay active.">
                <Field label="Why should this club exist?" description="Show the unmet need, the student demand, or the opportunity the school community is missing." required>
                  <Textarea value={values.whyExist} onChange={(event) => updateField("whyExist", event.target.value)} />
                </Field>
                <Field label="What makes it unique?" description="Explain why this club is meaningfully different from anything students already have access to." required>
                  <Textarea value={values.uniqueValue} onChange={(event) => updateField("uniqueValue", event.target.value)} />
                </Field>
                <Field label="Planned events" description="List the first events, sessions, or initiatives the club would actually run." required>
                  <div className="space-y-3">
                    {values.plannedEvents.map((value, index) => (
                      <div key={`event-${index}`} className="flex items-center gap-3">
                        <Input value={value} onChange={(event) => updateArrayValue("plannedEvents", index, event.target.value)} />
                        <Button type="button" variant="secondary" size="sm" onClick={() => removeArrayValue("plannedEvents", index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => addArrayValue("plannedEvents")} className="justify-start px-0">
                      <Plus className="h-4 w-4" />
                      Add event
                    </Button>
                  </div>
                </Field>
              </StepShell>
            ) : null}

            {step === 3 ? (
              <StepShell eyebrow="Step 4" title="Logistics" description="Wrap the proposal with practical details so the review team can picture the club running smoothly.">
                <Field label="Meeting frequency" description="Choose the rhythm the club can realistically sustain." required>
                  <div className="grid gap-3 md:grid-cols-2">
                    {CHARTER_MEETING_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField("meetingFrequency", option)}
                        className={cn(
                          "rounded-[24px] border px-4 py-4 text-left text-sm transition-all duration-200",
                          values.meetingFrequency === option
                            ? "border-neutral-900 bg-neutral-950 text-white shadow-[0_16px_40px_rgba(17,24,39,0.16)] dark:border-white dark:bg-white dark:text-neutral-950"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Expected member count" description="Estimate the initial student audience." required>
                    <Input
                      type="number"
                      min={1}
                      value={values.expectedMemberCount}
                      onChange={(event) => updateField("expectedMemberCount", event.target.value)}
                    />
                  </Field>
                  <Field label="Advisor" description="Optional, but a named advisor makes a proposal stronger.">
                    <Input value={values.advisorName} onChange={(event) => updateField("advisorName", event.target.value)} />
                  </Field>
                </div>
                <Field label="Advisor email" description="Optional contact for follow-up and next steps.">
                  <Input type="email" value={values.advisorEmail} onChange={(event) => updateField("advisorEmail", event.target.value)} />
                </Field>
              </StepShell>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Step 5</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 dark:text-white">Final review</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500 dark:text-neutral-400">
                        Make sure the story is sharp, the structure is clear, and the details feel ready for admin review.
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        <ShieldCheck className="h-4 w-4" />
                        Review team sees this exactly as submitted
                      </div>
                    </div>
                  </div>
                </div>
                <CharterReview values={values} onEditStep={setStep} />
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0 || isPending}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col gap-3 md:flex-row">
            {step < CHARTER_STEPS.length - 1 ? (
              <Button type="button" size="lg" onClick={goNext} disabled={isPending}>
                Next step
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={submit} disabled={isPending}>
                <Send className="h-4 w-4" />
                {isPending ? "Submitting..." : "Submit charter application"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
