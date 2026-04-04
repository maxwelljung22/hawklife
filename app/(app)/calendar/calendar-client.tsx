// app/(app)/calendar/calendar-client.tsx
"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createSchoolEvent, deleteSchoolEvent, updateSchoolEvent } from "./actions";

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: string;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  club: { name: string; emoji: string; slug: string; gradientFrom: string; gradientTo: string } | null;
}

type EventFormState = {
  title: string;
  description: string;
  location: string;
  type: CalEvent["type"];
  startTime: string;
  endTime: string;
};

const TYPE_COLORS: Record<string, string> = {
  MEETING:     "bg-navy/80",
  COMPETITION: "bg-crimson/80",
  SOCIAL:      "bg-emerald-600/80",
  SERVICE:     "bg-amber-600/80",
  SCHOOL_WIDE: "bg-purple-600/80",
  OTHER:       "bg-muted-foreground/60",
};

function getEventDate(value: string | Date) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = parseISO(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  return null;
}

function toDateTimeLocal(value: string | Date) {
  const date = getEventDate(value);
  if (!date) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function createEmptyForm() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(14, 5, 0, 0);
  const end = new Date(now);
  end.setHours(14, 40, 0, 0);

  return {
    title: "",
    description: "",
    location: "",
    type: "SCHOOL_WIDE",
    startTime: toDateTimeLocal(start),
    endTime: toDateTimeLocal(end),
  } satisfies EventFormState;
}

function normalizeManagedEvent(
  event: Omit<CalEvent, "club"> & { club?: CalEvent["club"] | null }
): CalEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    location: event.location ?? null,
    type: event.type,
    startTime: event.startTime,
    endTime: event.endTime,
    isAllDay: event.isAllDay,
    club: event.club ?? null,
  };
}

export function CalendarClient({ events, canManageSchoolEvents = false }: { events: CalEvent[]; canManageSchoolEvents?: boolean }) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isPending, startTransition] = useTransition();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(createEmptyForm());
  const [eventItems, setEventItems] = useState(events);
  const { toast } = useToast();
  const validEvents = useMemo(
    () => eventItems.filter((evt) => getEventDate(evt.startTime)),
    [eventItems]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart);
    const gridEnd    = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const evt of validEvents) {
      const start = getEventDate(evt.startTime);
      if (!start) continue;
      const key = format(start, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    }
    return map;
  }, [validEvents]);

  const selectedDayEvents = selectedDay
    ? eventsByDate[format(selectedDay, "yyyy-MM-dd")] ?? []
    : [];

  const upcomingEvents = validEvents
    .filter((e) => {
      const start = getEventDate(e.startTime);
      return start ? start >= new Date() : false;
    })
    .slice(0, 8);

  const selectedManagedEvent = useMemo(() => {
    if (!editingEventId) return null;
    return validEvents.find((event) => event.id === editingEventId && !event.club) ?? null;
  }, [editingEventId, validEvents]);

  const schoolEvents = useMemo(
    () => validEvents.filter((event) => !event.club),
    [validEvents]
  );

  const openCreateForm = () => {
    setEditingEventId(null);
    setForm(createEmptyForm());
  };

  const openEditForm = (event: CalEvent) => {
    setEditingEventId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      type: event.type,
      startTime: toDateTimeLocal(event.startTime),
      endTime: toDateTimeLocal(event.endTime),
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        type: form.type as any,
        startTime: form.startTime,
        endTime: form.endTime,
      };

      const result = editingEventId
        ? await updateSchoolEvent(editingEventId, payload)
        : await createSchoolEvent(payload);

      if ("error" in result) {
        toast({
          title: editingEventId ? "Couldn't update event" : "Couldn't create event",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      if (!("event" in result)) {
        toast({
          title: "Couldn't update calendar",
          description: "That school calendar event response was incomplete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: editingEventId ? "Event updated" : "Event created",
        description: `${result.event.title} is now on the school calendar.`,
      });

      const nextEvent = normalizeManagedEvent(result.event);
      setEventItems((current) => {
        if (editingEventId) {
          return current.map((item) => (item.id === nextEvent.id ? nextEvent : item));
        }
        return [nextEvent, ...current];
      });
      setEditingEventId(null);
      setForm(createEmptyForm());
      router.refresh();
    });
  };

  const handleDelete = (event: CalEvent) => {
    startTransition(async () => {
      const result = await deleteSchoolEvent(event.id);
      if ("error" in result) {
        toast({
          title: "Couldn't delete event",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Event deleted",
        description: `${event.title} was removed from the school calendar.`,
      });

      setEventItems((current) => current.filter((item) => item.id !== event.id));
      if (editingEventId === event.id) {
        setEditingEventId(null);
        setForm(createEmptyForm());
      }
      router.refresh();
    });
  };

  if (validEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[.10em] text-crimson">Schedule</p>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-foreground">
            Activity <span className="italic">Calendar</span>
          </h1>
        </div>

        {canManageSchoolEvents ? (
          <SchoolEventManager
            form={form}
            setForm={setForm}
            isPending={isPending}
            editingEventId={editingEventId}
            onSubmit={handleSubmit}
            onReset={openCreateForm}
            schoolEvents={schoolEvents}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        ) : null}

        <div className="surface-card rounded-[32px] p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-muted text-2xl">
            📅
          </div>
          <h2 className="text-[24px] font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            No calendar events yet
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-7 text-muted-foreground">
            Once clubs or school admins add events for St. Joseph&apos;s Preparatory School, they&apos;ll appear here. Right now the calendar is clear.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">Schedule</p>
        <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
          Activity <span className="italic">Calendar</span>
        </h1>
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[18px] font-semibold text-foreground">Upcoming</p>
            <Link href="/clubs" className="text-[12px] font-semibold text-crimson">Browse clubs →</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No upcoming events right now.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map((evt, i) => (
                <EventRow key={evt.id} evt={evt} index={i} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 shadow-card sm:p-6">
          {/* Month nav */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-[20px] font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
                className="h-10 rounded-xl border border-border bg-card px-4 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="mb-1 hidden grid-cols-7 sm:grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10.5px] font-bold uppercase tracking-[.07em] text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-7 gap-px overflow-hidden rounded-xl bg-border sm:min-w-0">
            {calendarDays.map((day) => {
              const key       = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[key] ?? [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "group relative bg-card min-h-[60px] p-1.5 text-left transition-colors hover:bg-muted/40 sm:min-h-[72px]",
                    !isCurrentMonth && "bg-muted/20 dark:bg-muted/10",
                    isSelected && "bg-crimson/5 dark:bg-crimson/10 ring-1 ring-inset ring-crimson/20"
                  )}
                >
                  <div className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-medium mb-1",
                    today && "bg-crimson text-white font-bold shadow-md shadow-crimson/30",
                    !today && !isCurrentMonth && "text-muted-foreground/40",
                    !today && isCurrentMonth && "text-foreground group-hover:text-crimson transition-colors"
                  )}>
                    {format(day, "d")}
                  </div>

                  {/* Event dots */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className={cn(
                          "hidden truncate rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white sm:block",
                          TYPE_COLORS[evt.type] ?? "bg-muted-foreground/60"
                        )}
                      >
                        {evt.club?.emoji ?? "📅"} {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 0 && (
                      <div className="pl-0.5 text-[9px] font-medium text-muted-foreground sm:hidden">
                        {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                      </div>
                    )}
                    {dayEvents.length > 2 && (
                      <div className="hidden pl-1 text-[9px] font-medium text-muted-foreground sm:block">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {canManageSchoolEvents ? (
            <SchoolEventManager
              form={form}
              setForm={setForm}
              isPending={isPending}
              editingEventId={editingEventId}
              onSubmit={handleSubmit}
              onReset={openCreateForm}
              schoolEvents={schoolEvents}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ) : null}

          {/* Selected day events */}
          <div className="hidden bg-card border border-border rounded-2xl shadow-card overflow-hidden lg:block">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-[14px] text-foreground">
                {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Select a day"}
              </p>
              {selectedDayEvents.length === 0 && selectedDay && (
                <p className="text-[12px] text-muted-foreground mt-0.5">No events</p>
              )}
            </div>
            <div>
              <AnimatePresence mode="wait">
                {selectedDayEvents.length > 0 ? (
                  <motion.div key={selectedDay?.toISOString()}>
                    {selectedDayEvents.map((evt, i) => (
                      <EventRow key={evt.id} evt={evt} index={i} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-3xl opacity-20 mb-2">📅</p>
                    <p className="text-[13px] text-muted-foreground">Nothing scheduled</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-[14px] text-foreground">Upcoming Events</p>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map((evt, i) => (
                <EventRow key={evt.id} evt={evt} index={i} compact />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SchoolEventManager({
  form,
  setForm,
  isPending,
  editingEventId,
  onSubmit,
  onReset,
  schoolEvents,
  onEdit,
  onDelete,
}: {
  form: EventFormState;
  setForm: Dispatch<SetStateAction<EventFormState>>;
  isPending: boolean;
  editingEventId: string | null;
  onSubmit: () => void;
  onReset: () => void;
  schoolEvents: CalEvent[];
  onEdit: (event: CalEvent) => void;
  onDelete: (event: CalEvent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="surface-card rounded-[28px] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[.10em] text-crimson">School calendar</p>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-foreground">Manage events</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={onReset}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <Input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Event title"
          />
          <Textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            className="min-h-[110px]"
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <Input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Location"
            />
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="flex h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-[0_1px_0_rgba(17,24,39,0.02)] transition-all duration-200 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
            >
              <option value="SCHOOL_WIDE">School-wide</option>
              <option value="MEETING">Meeting</option>
              <option value="SOCIAL">Social</option>
              <option value="SERVICE">Service</option>
              <option value="COMPETITION">Competition</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Input
              type="datetime-local"
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={form.endTime}
              onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            <Button onClick={onSubmit} disabled={isPending} className="min-w-[152px]">
              {editingEventId ? "Save changes" : "Add event"}
            </Button>
            {editingEventId ? (
              <Button variant="ghost" onClick={onReset} disabled={isPending} className="min-w-[132px]">
                Cancel edit
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="surface-card rounded-[28px] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-foreground">School-wide events</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Faculty and admins can update events that are not tied to a club.</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {schoolEvents.length} events
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {schoolEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-foreground">No school-wide events yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Add one above and it’ll appear here right away.</p>
            </div>
          ) : (
            schoolEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {format(getEventDate(event.startTime) ?? new Date(), "MMM d · h:mm a")} to{" "}
                      {format(getEventDate(event.endTime) ?? new Date(), "h:mm a")}
                    </p>
                    {event.location ? (
                      <p className="mt-1 text-[12px] text-muted-foreground">{event.location}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(event)} className="min-w-[92px]">
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(event)} className="min-w-[98px]">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ evt, index, compact = false }: { evt: CalEvent; index: number; compact?: boolean }) {
  const colorClass = TYPE_COLORS[evt.type] ?? "bg-muted-foreground/60";
  const slug = evt.club?.slug;
  const start = getEventDate(evt.startTime);

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.25 } }}
      className={cn(
        "flex gap-3 border-b border-border/50 px-4 py-3 last:border-0 transition-colors hover:bg-muted/30 sm:px-5",
        slug && "cursor-pointer"
      )}
    >
      <div className={cn("w-1 flex-shrink-0 rounded-full my-0.5", colorClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{evt.title}</p>
        {evt.club && (
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            {evt.club.emoji} {evt.club.name}
          </p>
        )}
        {!compact && (
          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            {evt.location && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {evt.location}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {start ? format(start, "h:mm a") : "Time TBD"}
            </span>
          </div>
        )}
        {compact && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {start ? format(start, "MMM d · h:mm a") : "Date TBD"}
          </p>
        )}
      </div>
    </motion.div>
  );

  return slug ? <Link href={`/clubs/${slug}`}>{inner}</Link> : inner;
}
