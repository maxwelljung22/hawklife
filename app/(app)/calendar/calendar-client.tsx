// app/(app)/calendar/calendar-client.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export function CalendarClient({ events }: { events: CalEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const validEvents = useMemo(
    () => events.filter((evt) => getEventDate(evt.startTime)),
    [events]
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
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
                className="px-3 h-8 rounded-lg border border-border bg-card text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
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
