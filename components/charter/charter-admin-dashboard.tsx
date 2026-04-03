"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { Check, Clock3, MessageSquareMore, Search, X } from "lucide-react";
import type { ApplicationStatus, ClubCategory } from "@prisma/client";
import { formatDate, formatRelativeTime, initials, cn } from "@/lib/utils";
import { CHARTER_STATUS_STYLES, getCharterStatusLabel } from "@/lib/charter";
import { reviewCharterApplication } from "@/app/(app)/charter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type CharterApplicationRow = {
  id: string;
  clubName: string;
  category: ClubCategory;
  founderName: string;
  expectedMemberCount: number;
  meetingFrequency: string;
  status: ApplicationStatus;
  reviewNotes: string | null;
  submittedAt: Date;
  createdAt: Date;
  applicant: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

interface Props {
  applications: CharterApplicationRow[];
}

const FILTERS: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WAITLISTED"];

export function CharterAdminDashboard({ applications }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesFilter = filter === "ALL" || application.status === filter;
      const matchesSearch =
        !query ||
        application.clubName.toLowerCase().includes(query) ||
        application.founderName.toLowerCase().includes(query) ||
        application.applicant.email?.toLowerCase().includes(query) ||
        application.applicant.name?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [applications, filter, search]);

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<ApplicationStatus, number>>((acc, status) => {
        acc[status] = applications.filter((application) => application.status === status).length;
        return acc;
      }, {
        SUBMITTED: 0,
        UNDER_REVIEW: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        WAITLISTED: 0,
      }),
    [applications]
  );

  const updateStatus = (applicationId: string, status: ApplicationStatus) => {
    startTransition(async () => {
      const result = await reviewCharterApplication({
        applicationId,
        status,
        reviewNotes: notes[applicationId] ?? "",
      });

      if (result?.error) {
        toast({ title: "Update failed", description: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Status updated", description: `Application marked ${getCharterStatusLabel(status).toLowerCase()}.` });
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[34px] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.96))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.12),transparent_30%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(10,10,10,0.96))]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Club Charter Queue</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-neutral-950 dark:text-white">Review charter applications with speed and context.</h1>
            <p className="mt-4 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
              Keep reviews crisp, move strong proposals forward quickly, and leave notes the founding team can act on.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {FILTERS.map((status) => (
              <div key={status} className="rounded-[24px] border border-neutral-200 bg-white/90 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/90">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">{getCharterStatusLabel(status)}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">{counts[status]}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="rounded-[30px] border border-neutral-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-11" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={filter === "ALL" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("ALL")}>
              All
            </Button>
            {FILTERS.map((status) => (
              <Button
                key={status}
                type="button"
                variant={filter === status ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {getCharterStatusLabel(status)}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04, duration: 0.22 } }}
              className="rounded-[28px] border border-neutral-200 bg-neutral-50/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-900/50"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">{application.clubName}</h2>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", CHARTER_STATUS_STYLES[application.status])}>
                      {getCharterStatusLabel(application.status)}
                    </span>
                    <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {application.category.toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={application.applicant.image ?? undefined} />
                        <AvatarFallback className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                          {initials(application.applicant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.applicant.name}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{application.applicant.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                      <span>Founder: {application.founderName}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{application.expectedMemberCount} expected members</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{application.meetingFrequency}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-5 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      Submitted {formatRelativeTime(application.submittedAt)}
                    </span>
                    <span>Created {formatDate(application.createdAt, "MMM d")}</span>
                  </div>
                </div>

                <div className="w-full xl:max-w-sm">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                    Reviewer notes
                  </label>
                  <textarea
                    value={notes[application.id] ?? application.reviewNotes ?? ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                    className="min-h-[96px] w-full rounded-[22px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition-all duration-200 focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-700 dark:focus:ring-white/10"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => updateStatus(application.id, "UNDER_REVIEW")} disabled={pending}>
                      <MessageSquareMore className="h-4 w-4" />
                      Review
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => updateStatus(application.id, "ACCEPTED")} disabled={pending}>
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="danger" onClick={() => updateStatus(application.id, "REJECTED")} disabled={pending}>
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-lg font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">No charter applications match this view.</p>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Try a broader filter or search by founder, club, or email.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
