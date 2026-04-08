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
import {
  addStudentsToFlexSession,
  addStudentsToMultipleFlexSessions,
  createFlexSession,
  deleteFlexSession,
  markFlexAttendanceManually,
} from "@/app/(app)/flex/actions";
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
  date: string;
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
  const [activeTab, setActiveTab] = useState<"create" | "attendance" | "assign">("create");
  const [reportView, setReportView] = useState<"recorded" | "missing" | "absent">("recorded");
  const [assignmentSessionIds, setAssignmentSessionIds] = useState<string[]>([]);
  const isAdmin = currentRole === "ADMIN";
  const canUsePresign = currentRole === "ADMIN" || currentRole === "FACULTY";
  const [form, setForm] = useState({
    title: "",
    type: "STUDY_HALL" as AttendanceSessionType,
    clubId: "",
    location: "",
    capacity: "24",
    recurrenceEnabled: false,
    recurrenceWeeks: "6",
    recurrenceDays: [new Date().getDay()] as number[],
  });
  const todayKey = new Date().toDateString();

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === form.clubId) ?? null,
    [clubs, form.clubId]
  );

  const selectedQrSession = sessions.find((session) => session.id === selectedQrSessionId) ?? null;
  const todaySessions = sessions.filter((session) => new Date(session.date).toDateString() === todayKey);
  const upcomingSessions = sessions.filter((session) => new Date(session.date) > new Date() && new Date(session.date).toDateString() !== todayKey);
  const historySessions = sessions.filter((session) => new Date(session.date) < new Date(new Date().setHours(0, 0, 0, 0)));
  const assignableSessions = sessions.filter((session) => new Date(session.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const selectedDateKey = selectedQrSession ? new Date(selectedQrSession.date).toDateString() : null;
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

  const flexDateSignedUpUserIds = useMemo(() => {
    if (!selectedDateKey) return new Set<string>();

    return new Set(
      sessions
        .filter((session) => new Date(session.date).toDateString() === selectedDateKey)
        .flatMap((session) => session.attendees.map((attendee) => attendee.user.id))
    );
  }, [selectedDateKey, sessions]);

  const missingFlexSignupStudents = useMemo(
    () => students.filter((student) => !flexDateSignedUpUserIds.has(student.id)),
    [flexDateSignedUpUserIds, students]
  );

  const attendanceSummary = useMemo(() => {
    if (!selectedQrSession) return null;
    const absent = selectedQrSession.attendees.filter(
      (attendee) => attendee.status === "ABSENT" || attendee.status === "ABSENT_EXCUSED"
    );

    return {
      absent,
      absentExcused: selectedQrSession.attendees.filter((attendee) => attendee.status === "ABSENT_EXCUSED"),
      lateExcused: selectedQrSession.attendees.filter((attendee) => attendee.status === "LATE_EXCUSED"),
    };
  }, [selectedQrSession]);

  const effectiveSelectedIds = useMemo(() => {
    if (bulkStudentIds.length > 0) return Array.from(new Set(bulkStudentIds));
    return selectedStudentId ? [selectedStudentId] : [];
  }, [bulkStudentIds, selectedStudentId]);

  const visibleReportAttendees = useMemo(() => {
    if (!selectedQrSession) return [];
    if (reportView === "absent") {
      return attendanceSummary?.absent ?? [];
    }

    return selectedQrSession.attendees;
  }, [attendanceSummary, reportView, selectedQrSession]);

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createFlexSession({
        title: form.type === "CLUB" ? form.title || selectedClub?.name || "" : form.title,
        type: form.type,
        clubId: form.type === "CLUB" ? form.clubId : undefined,
        location: form.location || selectedClub?.meetingRoom || "",
        capacity: Number(form.capacity),
        recurringWeekdays: form.recurrenceEnabled ? form.recurrenceDays : [],
        recurrenceWeeks: Number(form.recurrenceWeeks),
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
        description: result.createdCount > 1
          ? `${result.createdCount} flex sessions were scheduled for ${result.session.title}.`
          : `${result.session.title} is live for today's flex block.`,
      });
      setForm({
        title: "",
        type: "STUDY_HALL",
        clubId: "",
        location: "",
        capacity: "24",
        recurrenceEnabled: false,
        recurrenceWeeks: "6",
        recurrenceDays: [new Date().getDay()],
      });
      setReportView("recorded");
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
      if (selectedQrSessionId === sessionId) {
        setSelectedQrSessionId(null);
        setReportView("recorded");
      }
      router.refresh();
    });
  };

  const handleManualMark = (status: AttendanceStatus, userId?: string | string[]) => {
    if (!selectedQrSession) return;
    const targetUserId = userId ?? effectiveSelectedIds;
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

  const handleBulkAdd = (userIds?: string | string[]) => {
    if (!selectedQrSession) return;
    const targetUserIds = userIds ?? effectiveSelectedIds;
    if (!targetUserIds || (Array.isArray(targetUserIds) && targetUserIds.length === 0)) {
      toast({
        title: "Choose students first",
        description: "Select one or more students to add to this flex roster.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await addStudentsToFlexSession(selectedQrSession.id, targetUserIds);
      if ("error" in result) {
        toast({
          title: "Couldn't add students",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Roster updated",
        description: result.updatedCount > 1
          ? `${result.updatedCount} students were added to ${result.title}.`
          : `${result.studentName} was added to ${result.title}.`,
      });
      setSelectedStudentId("");
      setStudentQuery("");
      setBulkStudentIds([]);
      router.refresh();
    });
  };

  const toggleBulkStudent = (studentId: string) => {
    setBulkStudentIds((current) =>
      current.includes(studentId) ? current.filter((value) => value !== studentId) : [...current, studentId]
    );
  };

  const toggleAssignmentSession = (sessionId: string) => {
    setAssignmentSessionIds((current) =>
      current.includes(sessionId) ? current.filter((value) => value !== sessionId) : [...current, sessionId]
    );
  };

  const handleRequireStudents = () => {
    if (assignmentSessionIds.length === 0) {
      toast({
        title: "Choose flex dates first",
        description: "Pick one or more flex sessions to pre-sign students into.",
        variant: "destructive",
      });
      return;
    }

    if (effectiveSelectedIds.length === 0) {
      toast({
        title: "Choose students first",
        description: "Select one or more students to require for the chosen flex dates.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await addStudentsToMultipleFlexSessions(assignmentSessionIds, effectiveSelectedIds);
      if ("error" in result) {
        toast({
          title: "Couldn't require flex signup",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Flex signup required",
        description:
          result.assignedStudentCount > 1 || result.assignedSessionCount > 1
            ? `${result.assignedStudentCount} students were pre-signed into ${result.assignedSessionCount} flex blocks.`
            : `${result.studentName} was pre-signed into ${result.sessionTitle}.`,
      });
      setAssignmentSessionIds([]);
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

  const exportAttendance = (format: "csv" | "pdf", sessionId?: string) => {
    const targetSessionId = sessionId ?? selectedQrSession?.id;
    if (!targetSessionId) return;
    window.location.href = `/api/flex/export?sessionId=${targetSessionId}&format=${format}`;
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
          attendance QR that refreshes automatically, or you can keep the same QR for printing.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { key: "create", label: "Create Sessions" },
            { key: "attendance", label: "Attendance" },
            { key: "assign", label: "Require / Pre-sign" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as "create" | "attendance" | "assign")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] text-foreground"
                  : "border-border bg-background/70 text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "create" ? (
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

            <div className="rounded-[28px] border border-border bg-muted/35 p-4">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.recurrenceEnabled}
                  onChange={(event) => setForm((current) => ({ ...current, recurrenceEnabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                Create this as a recurring flex block
              </label>

              {form.recurrenceEnabled ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Repeat on</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, weekday) => {
                        const active = form.recurrenceDays.includes(weekday);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                recurrenceDays: current.recurrenceDays.includes(weekday)
                                  ? current.recurrenceDays.filter((value) => value !== weekday)
                                  : [...current.recurrenceDays, weekday].sort((a, b) => a - b),
                              }))
                            }
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                              active ? "border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] text-foreground" : "border-border bg-background text-muted-foreground"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Number of weeks</span>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={form.recurrenceWeeks}
                      onChange={(event) => setForm((current) => ({ ...current, recurrenceWeeks: event.target.value }))}
                    />
                  </label>
                </div>
              ) : null}
            </div>

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
                {todaySessions.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-border p-8 text-center">
                    <p className="text-base font-semibold text-foreground">No sessions yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Create the first flex destination for students above.</p>
                  </div>
                ) : (
                todaySessions.map((session, index) => (
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
                        <Button variant="secondary" onClick={() => exportAttendance("csv", session.id)}>
                          <Download className="h-4 w-4" />
                          Spreadsheet
                        </Button>
                        <Button variant="secondary" onClick={() => exportAttendance("pdf", session.id)}>
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                        <Button variant="secondary" onClick={() => {
                          setSelectedQrSessionId(session.id);
                          setReportView("recorded");
                        }}>
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
        </section>
      </div>
      ) : null}

      {activeTab === "attendance" ? (
      <div className="space-y-6">
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
                            const bulkSelected = bulkStudentIds.includes(student.id);
                            return (
                              <div
                                key={student.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-2xl border px-3 py-3 transition-colors",
                                  active || bulkSelected
                                    ? "border-[hsl(var(--primary)/0.26)] bg-[hsl(var(--primary)/0.06)]"
                                    : "border-border bg-background hover:bg-muted/50"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentId(student.id)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <p className="truncate text-sm font-medium text-foreground">{student.name || "Unnamed student"}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {student.email || "No email"}{student.graduationYear ? ` · Class of ${student.graduationYear}` : ""}
                                  </p>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleBulkStudent(student.id)}
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                    bulkSelected
                                      ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.12)] text-foreground"
                                      : "border-border bg-background text-muted-foreground"
                                  )}
                                >
                                  {bulkSelected ? "Selected" : "Select"}
                                </button>
                                {active ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" /> : null}
                              </div>
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
                                    students
                                      .filter((student) => student.graduationYear === year)
                                      .map((student) => student.id)
                                  )
                                }
                                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
                              >
                                Class of {year}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setBulkStudentIds(availableStudents.map((student) => student.id))}
                              className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
                            >
                              Select filtered
                            </button>
                            <button
                              type="button"
                              onClick={() => setBulkStudentIds([])}
                              className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
                            >
                              Clear
                            </button>
                          </div>
                          <p className="mt-2 text-[12px] text-muted-foreground">{effectiveSelectedIds.length} students ready for bulk actions</p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {canUsePresign ? (
                            <Button variant="secondary" size="lg" onClick={() => handleBulkAdd()} disabled={isPending || effectiveSelectedIds.length === 0}>
                              <Plus className="h-4 w-4" />
                              Add selected
                            </Button>
                          ) : null}
                          <Button size="lg" onClick={() => handleManualMark("PRESENT")} disabled={isPending || effectiveSelectedIds.length === 0}>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark present
                          </Button>
                          <Button variant="secondary" size="lg" onClick={() => handleManualMark("LATE")} disabled={isPending || effectiveSelectedIds.length === 0}>
                            <Timer className="h-4 w-4" />
                            Mark late
                          </Button>
                          <Button variant="secondary" size="lg" onClick={() => handleManualMark("ABSENT")} disabled={isPending || effectiveSelectedIds.length === 0}>
                            Mark absent
                          </Button>
                          {isAdmin ? (
                            <Button variant="secondary" size="lg" onClick={() => handleManualMark("ABSENT_EXCUSED")} disabled={isPending || effectiveSelectedIds.length === 0}>
                              Absent excused
                            </Button>
                          ) : null}
                          {isAdmin ? (
                            <Button variant="secondary" size="lg" onClick={() => handleManualMark("LATE_EXCUSED")} disabled={isPending || effectiveSelectedIds.length === 0}>
                              Late excused
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-border bg-background p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recorded attendees</p>
                            <p className="mt-1 text-sm text-muted-foreground">Review the live roster, missing flex signups, and students marked absent.</p>
                          </div>
                          <div className="rounded-full border border-border bg-muted/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                            {missingFlexSignupStudents.length} not signed up
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <button
                            type="button"
                            onClick={() => setReportView("missing")}
                            className={cn(
                              "rounded-[20px] border px-4 py-3 text-left transition-colors",
                              reportView === "missing"
                                ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.08)]"
                                : "border-border bg-muted/35"
                            )}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Not signed up</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{missingFlexSignupStudents.length}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">Across this flex date</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportView("absent")}
                            className={cn(
                              "rounded-[20px] border px-4 py-3 text-left transition-colors",
                              reportView === "absent"
                                ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.08)]"
                                : "border-border bg-muted/35"
                            )}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Marked absent</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.absent.length ?? 0}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">This session only</p>
                          </button>
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Absent Excused</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.absentExcused.length ?? 0}</p>
                          </div>
                          <div className="rounded-[20px] border border-border bg-muted/35 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Late Excused</p>
                            <p className="mt-2 text-xl font-semibold text-foreground">{attendanceSummary?.lateExcused.length ?? 0}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {[
                            { key: "recorded", label: "Recorded roster" },
                            { key: "missing", label: "Missing signup" },
                            { key: "absent", label: "Absent list" },
                          ].map((view) => (
                            <button
                              key={view.key}
                              type="button"
                              onClick={() => setReportView(view.key as "recorded" | "missing" | "absent")}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                                reportView === view.key
                                  ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.08)] text-foreground"
                                  : "border-border bg-background text-muted-foreground"
                              )}
                            >
                              {view.label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                          {reportView === "missing" ? (
                            missingFlexSignupStudents.length === 0 ? (
                              <div className="rounded-[24px] border border-dashed border-border px-4 py-8 text-center">
                                <p className="text-sm font-medium text-foreground">Everyone picked a flex block</p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  No students are missing a flex signup for this date.
                                </p>
                              </div>
                            ) : (
                              missingFlexSignupStudents.map((student) => (
                                <div key={student.id} className="rounded-[24px] border border-border bg-muted/30 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-foreground">{student.name || "Unnamed student"}</p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {student.email || "No email"}{student.graduationYear ? ` · Class of ${student.graduationYear}` : ""}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                        Not signed up
                                      </span>
                                      {canUsePresign ? (
                                        <Button size="sm" variant="secondary" onClick={() => handleBulkAdd(student.id)} disabled={isPending}>
                                          <Plus className="h-4 w-4" />
                                          Add to session
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )
                          ) : visibleReportAttendees.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-border px-4 py-8 text-center">
                              <p className="text-sm font-medium text-foreground">
                                {reportView === "absent" ? "No absences recorded" : "No one recorded yet"}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {reportView === "absent"
                                  ? "Students marked absent will appear here."
                                  : "Students will appear here after they join or when you mark them manually."}
                              </p>
                            </div>
                          ) : (
                            visibleReportAttendees.map((attendee) => (
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
                                  {canUsePresign ? (
                                    <Button size="sm" variant="secondary" onClick={() => handleBulkAdd(attendee.user.id)} disabled={isPending}>
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                  ) : null}
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
            ) : (
              <div className="surface-card rounded-[32px] p-8 text-center">
                <p className="text-base font-semibold text-foreground">Pick a flex session to manage attendance</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose any active or scheduled flex block below to open its QR code, roster, and reports.
                </p>
              </div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 xl:grid-cols-2">
          <div className="surface-card rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Upcoming recurring blocks</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Scheduled flex sessions</h2>
              </div>
              <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                {upcomingSessions.length} upcoming
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {upcomingSessions.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No upcoming recurring flex blocks yet.
                </div>
              ) : (
                upcomingSessions.slice(0, 10).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setSelectedQrSessionId(session.id);
                      setReportView("recorded");
                    }}
                    className="flex items-center justify-between rounded-[24px] border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{session.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · {session.location}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{getSessionTypeLabel(session.type)}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">History</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Flex block history</h2>
              </div>
              <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                {historySessions.length} past
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {historySessions.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No past sessions yet.
                </div>
              ) : (
                historySessions.slice(0, 12).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setSelectedQrSessionId(session.id);
                      setReportView("recorded");
                    }}
                    className="flex items-center justify-between rounded-[24px] border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{session.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · {session.attendeeCount} recorded
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{getSessionTypeLabel(session.type)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          </div>
      </div>
      ) : null}

      {activeTab === "assign" ? (
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-card rounded-[32px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Require flex signup</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Pre-sign students into flex blocks</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Teachers and admins can select students, then assign them into one or more upcoming flex dates ahead of time.
              </p>
            </div>
            <div className="rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
              {assignmentSessionIds.length} dates selected
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAssignmentSessionIds(todaySessions.map((session) => session.id))}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                Select today
              </button>
              <button
                type="button"
                onClick={() => setAssignmentSessionIds(assignableSessions.slice(0, 5).map((session) => session.id))}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                Next 5 blocks
              </button>
              <button
                type="button"
                onClick={() => setAssignmentSessionIds(assignableSessions.map((session) => session.id))}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                Select all shown
              </button>
              <button
                type="button"
                onClick={() => setAssignmentSessionIds([])}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
              >
                Clear
              </button>
            </div>

            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {assignableSessions.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Create a flex block first, then you can require students for that date here.
                </div>
              ) : (
                assignableSessions.map((session) => {
                  const selected = assignmentSessionIds.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => toggleAssignmentSession(session.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left transition-colors",
                        selected
                          ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.08)]"
                          : "border-border bg-background hover:bg-muted/50"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{session.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(session.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · {session.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-muted-foreground">{getSessionTypeLabel(session.type)}</span>
                        {selected ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" /> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="surface-card rounded-[32px] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Student selection</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-foreground">Choose who to require</h3>
            </div>
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
              const bulkSelected = bulkStudentIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-3 transition-colors",
                    active || bulkSelected
                      ? "border-[hsl(var(--primary)/0.26)] bg-[hsl(var(--primary)/0.06)]"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-foreground">{student.name || "Unnamed student"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.email || "No email"}{student.graduationYear ? ` · Class of ${student.graduationYear}` : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBulkStudent(student.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      bulkSelected
                        ? "border-[hsl(var(--primary)/0.28)] bg-[hsl(var(--primary)/0.12)] text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {bulkSelected ? "Selected" : "Select"}
                  </button>
                  {active ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))]" /> : null}
                </div>
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
                      students
                        .filter((student) => student.graduationYear === year)
                        .map((student) => student.id)
                    )
                  }
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
                >
                  Class of {year}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBulkStudentIds(availableStudents.map((student) => student.id))}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground"
              >
                Select filtered
              </button>
              <button
                type="button"
                onClick={() => setBulkStudentIds([])}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted-foreground"
              >
                Clear
              </button>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">{effectiveSelectedIds.length} students ready to be required</p>
          </div>

          <div className="mt-4 rounded-[24px] border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
            Selected students will be pre-signed into the chosen flex blocks as joined attendees, so they appear on rosters before the date arrives.
          </div>

          <Button size="lg" className="mt-4 w-full" onClick={handleRequireStudents} disabled={isPending || effectiveSelectedIds.length === 0 || assignmentSessionIds.length === 0}>
            <Plus className="h-4 w-4" />
            Require selected students
          </Button>
        </section>
      </div>
      ) : null}
    </motion.div>
  );
}
