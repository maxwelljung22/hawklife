"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { AttendanceSessionType } from "@prisma/client";
import { CalendarDays, MapPin, Plus, QrCode, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createFlexSession, deleteFlexSession } from "@/app/(app)/flex/actions";
import { FLEX_BLOCK_LABEL, getSessionTypeLabel } from "@/lib/flex-attendance";
import { cn } from "@/lib/utils";
import { QrDisplay } from "@/components/attendance/qr-display";

type ClubOption = {
  id: string;
  name: string;
  meetingRoom: string | null;
};

type SessionItem = {
  id: string;
  title: string;
  type: AttendanceSessionType;
  clubId: string | null;
  location: string;
  capacity: number;
  attendeeCount: number;
  hostName: string;
  isOpen: boolean;
};

export function FacultySessionManager({
  clubs,
  sessions,
}: {
  clubs: ClubOption[];
  sessions: SessionItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedQrSessionId, setSelectedQrSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [form, setForm] = useState({
    title: "",
    type: "STUDY_HALL" as AttendanceSessionType,
    clubId: "",
    location: "",
    capacity: "24",
  });

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === form.clubId) ?? null,
    [clubs, form.clubId]
  );

  const selectedQrSession = sessions.find((session) => session.id === selectedQrSessionId) ?? null;

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createFlexSession({
        title: form.type === "CLUB" ? form.title || selectedClub?.name || "" : form.title,
        type: form.type,
        clubId: form.type === "CLUB" ? form.clubId : undefined,
        location: form.location || selectedClub?.meetingRoom || "",
        capacity: Number(form.capacity),
      });

      if ("error" in result) {
        toast({
          title: "Couldn't create session",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Session created",
        description: `${result.session.title} is live for today's flex block.`,
      });
      setForm({
        title: "",
        type: "STUDY_HALL",
        clubId: "",
        location: "",
        capacity: "24",
      });
      setSelectedQrSessionId(result.session.id);
      router.refresh();
    });
  };

  const handleDelete = (sessionId: string) => {
    startTransition(async () => {
      const result = await deleteFlexSession(sessionId);
      if ("error" in result) {
        toast({
          title: "Couldn't remove session",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Session removed",
        description: "That flex session is no longer available to students.",
      });
      if (selectedQrSessionId === sessionId) setSelectedQrSessionId(null);
      router.refresh();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-6"
    >
      <section className="surface-panel rounded-[32px] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Faculty controls</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-foreground sm:text-[3.2rem]">Create flex sessions</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
          Open club meetings, study halls, and special events for today&apos;s flex window. Each session gets a live
          attendance QR that refreshes automatically.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-card rounded-[32px] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New session</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Today&apos;s flex block</h2>
            </div>
            <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
              {FLEX_BLOCK_LABEL}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AttendanceSessionType }))}
                  className="flex h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-[0_1px_0_rgba(17,24,39,0.02)] transition-all duration-200 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
                >
                  <option value="STUDY_HALL">Study Hall</option>
                  <option value="EVENT">Event</option>
                  <option value="CLUB">Club</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Capacity</span>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={form.capacity}
                  onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
                />
              </label>
            </div>

            {form.type === "CLUB" ? (
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Club</span>
                <select
                  value={form.clubId}
                  onChange={(event) => setForm((current) => ({ ...current, clubId: event.target.value, location: "" }))}
                  className="flex h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-[0_1px_0_rgba(17,24,39,0.02)] transition-all duration-200 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
                >
                  <option value="">Choose a club</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Title</span>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={form.type === "CLUB" ? selectedClub?.name || "Debate Team" : form.type === "EVENT" ? "Campus speaker session" : "Quiet study hall"}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Location</span>
              <Input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder={selectedClub?.meetingRoom || "Library Commons"}
              />
            </label>

            <Button size="lg" className="w-full" onClick={handleCreate} disabled={isPending}>
              <Plus className="h-4 w-4" />
              Create session
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface-card rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live sessions</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Today&apos;s attendance hosts</h2>
              </div>
              <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                {sessions.length} open
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {sessions.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border p-8 text-center">
                  <p className="text-base font-semibold text-foreground">No sessions yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Create the first flex destination for students above.</p>
                </div>
              ) : (
                sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className={cn(
                        "overflow-hidden rounded-[28px] border bg-card/90 p-5 shadow-card transition-all duration-200",
                        selectedQrSessionId === session.id ? "border-[hsl(var(--primary)/0.26)]" : "border-border"
                      )}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {getSessionTypeLabel(session.type)}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-foreground">{session.title}</h3>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {session.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {session.attendeeCount}/{session.capacity} joined
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {FLEX_BLOCK_LABEL}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setSelectedQrSessionId(session.id)}>
                          <QrCode className="h-4 w-4" />
                          Show QR
                        </Button>
                        {session.clubId ? (
                          <Link href={`/club/${session.clubId}/attendance`}>
                            <Button variant="ghost">Open club display</Button>
                          </Link>
                        ) : null}
                        <Button variant="ghost" onClick={() => handleDelete(session.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedQrSession ? (
              <motion.div
                key={selectedQrSession.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <QrDisplay
                  sessionId={selectedQrSession.id}
                  title={selectedQrSession.title}
                  subtitle={`Students can scan in for ${selectedQrSession.title} from this live code.`}
                  typeLabel={getSessionTypeLabel(selectedQrSession.type)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}
