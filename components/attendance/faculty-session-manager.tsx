"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { AttendanceSessionType, AttendanceStatus, UserRole } from "@prisma/client";
import { CalendarDays, CheckCircle2, Clock3, Download, MapPin, Plus, QrCode, Search, Timer, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createFlexSession, deleteFlexSession, markFlexAttendanceManually } from "@/app/(app)/flex/actions";
import { FLEX_BLOCK_LABEL, getAttendanceStatusLabel, getSessionTypeLabel } from "@/lib/flex-attendance";
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
  attendees: {
    id: string;
    status: AttendanceStatus;
    present: boolean;
    joinedAt: string;
    checkIn: string | null;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      grade: number | null;
      graduationYear: number | null;
    };
  }[];
};

export function FacultySessionManager({
  clubs,
  students,
  currentRole,
  sessions,
}: {
  clubs: ClubOption[];
  students: {
    id: string;
    name: string | null;
    email: string | null;
    grade: number | null;
    graduationYear: number | null;
  }[];
  currentRole: UserRole;
  sessions: SessionItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedQrSessionId, setSelectedQrSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const isAdmin = currentRole === "ADMIN";
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
  const availableStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const classFiltered = classFilter === "all"
      ? students
      : students.filter((student) => String(student.graduationYear ?? "") === classFilter);
    if (!query) return classFiltered.slice(0, 30);

    return classFiltered
      .filter((student) =>
        [student.name ?? "", student.email ?? ""].some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 30);
  }, [classFilter, studentQuery, students]);

  const signedUpUserIds = useMemo(
    () => new Set(sessions.flatMap((session) => session.attendees.map((attendee) => attendee.user.id))),
    [sessions]
  );

  const unsignedStudents = useMemo(
    () => students.filter((student) => !signedUpUserIds.has(student.id)),
    [signedUpUserIds, students]
  );

  const selectedSessionUnsignedStudents = useMemo(() => {
    if (!selectedQrSession) return [];
    const currentIds = new Set(selectedQrSession.attendees.map((attendee) => attendee.user.id));
    return students.filter((student) => !currentIds.has(student.id));
  }, [selectedQrSession, students]);

  const attendanceSummary = useMemo(() => {
    if (!selectedQrSession) return null;
    return {
      absent: selectedQrSession.attendees.filter((attendee) => attendee.status === "ABSENT"),
      absentExcused: selectedQrSession.attendees.filter((attendee) => attendee.status === "ABSENT_EXCUSED"),
      lateExcused: selectedQrSession.attendees.filter((attendee) => attendee.status === "LATE_EXCUSED"),
    };
  }, [selectedQrSession]);

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

  const handleManualMark = (status: AttendanceStatus, userId?: string | string[]) => {
    if (!selectedQrSession) return;
    const targetUserId = userId ?? (bulkStudentIds.length > 0 ? bulkStudentIds : selectedStudentId);
    if (!targetUserId || (Array.isArray(targetUserId) && targetUserId.length === 0)) {
      toast({
        title: "Choose a student first",
        description: "Pick one or more students to update attendance.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await markFlexAttendanceManually(selectedQrSession.id, targetUserId, status);
      if ("error" in result) {
        toast({
          title: "Couldn't mark attendance",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Attendance updated",
        description: result.updatedCount > 1
          ? `${result.updatedCount} students marked ${status.toLowerCase().replaceAll("_", " ")} for ${result.title}.`
          : `${result.studentName} marked ${status.toLowerCase().replaceAll("_", " ")} for ${result.title}.`,
      });
      setSelectedStudentId("");
      setStudentQuery("");
      setBulkStudentIds([]);
      router.refresh();
    });
  };

  const getStatusClass = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
      case "LATE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case "ABSENT":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
      case "ABSENT_EXCUSED":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
      case "LATE_EXCUSED":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const exportAttendance = (format: "csv" | "pdf") => {
    if (!selectedQrSession) return;
    window.location.href = `/api/flex/export?sessionId=${selectedQrSession.id}&format=${format}`;
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
                        <Button variant="secondary" onClick={() => exportAttendance("csv")}>
                          <Download className="h-4 w-4" />
                          Spreadsheet
                        </Button>
                        <Button variant="secondary" onClick={() => exportAttendance("pdf")}>
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
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
                <div className="space-y-6">
                  <QrDisplay
                    sessionId={selectedQrSession.id}
                    title={selectedQrSession.title}
                    subtitle={`Students can scan in for ${selectedQrSession.title} from this live code.`}
                    typeLabel={getSessionTypeLabel(selectedQrSession.type)}
                  />

                  <section className="surface-card rounded-[32px] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manual attendance</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Mark students manually</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Faculty and admins can manually record present or late attendance for this session.
                        </p>
                      </div>
                      <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                        {selectedQrSession.attendees.length} recorded
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                      <div className="rounded-[28px] border border-border bg-muted/35 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <label className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Search student
                          </label>
                          <select
                            value={classFilter}
                            onChange={(event) => setClassFilter(event.target.value)}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground outline-none"
                          >
                            <option value="all">All classes</option>
                            {[2026, 2027, 2028, 2029].map((year) => (
                              <option key={year} value={year}>Class of {year}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-background px-3">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <input
                            value={studentQuery}
                            onChange={(event) => setStudentQuery(event.target.value)}
                            placeholder="Search by name or email"
                            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          />
                        </div>

                        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                          {availableStudents.map((student) => {
                            const active = selectedStudentId === student.id;
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => setSelectedStudentId(student.id)}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors",
                                  active ? "border-[hsl(var(--primary)/0.26)] bg-[hsl(var(--primary)/0.06)]" : "border-border bg-background hover:bg-muted/50"
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{student.name || "Unnamed student"}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {student.email || "No email"}{student.graduationYear ? ` · Class of ${student.graduationYear}` : ""}
                                  </p>
                                </div>
                                {active ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" /> : null}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 rounded-[24px] border border-border bg-background px-4 py-3">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mass select by class</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[2026, 2027, 2028, 2029].map((year) => (
                              <button
                                key={year}
                                type="button"
                                onClick={() =>
                                  setBulkStudentIds(
                                    availableStudents
                                      .filter((student) => student.graduationYear === year)
                                      .map((student) => student.id)
                                  )
                                }
                                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
                              >
                                Class of {year}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-[12px] text-muted-foreground">{bulkStudentIds.length} students selected for bulk actions</p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button size="lg" onClick={() => handleManualMark("PRESENT")} disabled={isPending || !selectedStudentId}>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark present
                          </Button>
                          <Button variant="secondary" size="lg" onClick={() => handleManualMark("LATE")} disabled={isPending || !selectedStudentId}>
                            <Timer className="h-4 w-4" />
                            Mark late
                          </Button>
                          <Button variant="secondary" size="lg" onClick={() => handleManualMark("ABSENT")} disabled={isPending || (!selectedStudentId && bulkStudentIds.length === 0)}>
                            Mark absent
                          </Button>
                          {isAdmin ? (
                            <Button variant="secondary" size="lg" onClick={() => handleManualMark("ABSENT_EXCUSED")} disabled={isPending || (!selectedStudentId && bulkStudentIds.length === 0)}>
                              Absent excused
                            </Button>
                          ) : null}
                          {isAdmin ? (
                            <Button variant="secondary" size="lg" onClick={() => handleManualMark("LATE_EXCUSED")} disabled={isPending || (!selectedStudentId && bulkStudentIds.length === 0)}>
                              Late excused
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-border bg-background p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recorded attendees</p>
                            <p className="mt-1 text-sm text-muted-foreground">Joined and manually marked students for this session.</p>
                          </div>
                          <div className="rounded-full border border-border bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            {selectedSessionUnsignedStudents.length} not signed up
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Not signed up</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{selectedSessionUnsignedStudents.length}</p>
                          </div>
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Absent</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.absent.length ?? 0}</p>
                          </div>
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Absent Excused</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.absentExcused.length ?? 0}</p>
                          </div>
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Late Excused</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.lateExcused.length ?? 0}</p>
                          </div>
                        </div>

                        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                          {selectedQrSession.attendees.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-border px-4 py-8 text-center">
                              <p className="text-sm font-medium text-foreground">No one recorded yet</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                Students will appear here after they join or when you mark them manually.
                              </p>
                            </div>
                          ) : (
                            selectedQrSession.attendees.map((attendee) => (
                              <div key={attendee.id} className="rounded-[24px] border border-border bg-muted/30 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{attendee.user.name || "Unnamed student"}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {attendee.user.email || "No email"}{attendee.user.graduationYear ? ` · Class of ${attendee.user.graduationYear}` : ""}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium", getStatusClass(attendee.status))}>
                                      {getAttendanceStatusLabel(attendee.status)}
                                    </span>
                                    {attendee.checkIn ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                        <Clock3 className="h-3 w-3" />
                                        {new Date(attendee.checkIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button size="sm" onClick={() => handleManualMark("PRESENT", attendee.user.id)} disabled={isPending}>
                                    Mark present
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleManualMark("LATE", attendee.user.id)} disabled={isPending}>
                                    Mark late
                                  </Button>
                                  <Button variant="secondary" size="sm" onClick={() => handleManualMark("ABSENT", attendee.user.id)} disabled={isPending}>
                                    Absent
                                  </Button>
                                  {isAdmin ? (
                                    <Button variant="secondary" size="sm" onClick={() => handleManualMark("ABSENT_EXCUSED", attendee.user.id)} disabled={isPending}>
                                      Absent excused
                                    </Button>
                                  ) : null}
                                  {isAdmin ? (
                                    <Button variant="secondary" size="sm" onClick={() => handleManualMark("LATE_EXCUSED", attendee.user.id)} disabled={isPending}>
                                      Late excused
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  );
}
