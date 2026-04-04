// app/(app)/clubs/[slug]/club-detail-client.tsx
"use client";

import { useState, useTransition, useOptimistic } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import {
  ArrowLeft, Calendar, MapPin, Clock, Users,
  FileText, Link2, ExternalLink, ChevronRight,
  CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { joinClub, leaveClub } from "../actions";
import { submitApplication, castVote, createPost, createClubEvent, createClubResource } from "./actions";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@prisma/client";
import { getClubLeadershipRoleLabel } from "@/lib/roles";

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "announcements", label: "Announcements" },
  { id: "events",        label: "Events" },
  { id: "members",       label: "Members" },
  { id: "resources",     label: "Resources" },
  { id: "applications",  label: "Apply", requiresApp: true },
];

interface Props {
  club: any;
  membership: any;
  userVotes: Record<string, string>;
  isLeader: boolean;
  userId: string;
  userRole: UserRole;
  defaultTab: string;
}

export function ClubDetailClient({ club, membership, userVotes, isLeader, userId, userRole, defaultTab }: Props) {
  const [tab, setTab] = useState(defaultTab);
  const [joined, setJoined] = useState(membership?.status === "ACTIVE");
  const [memberCount, setMemberCount] = useState(club._count.memberships);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isAdmin = userRole === "ADMIN";
  const canManage = isAdmin || isLeader;

  const handleToggle = () => {
    const next = !joined;
    setJoined(next);
    setMemberCount((c: number) => c + (next ? 1 : -1));

    startTransition(async () => {
      const result = next ? await joinClub(club.id) : await leaveClub(club.id);
      if (result?.error) {
        setJoined(!next);
        setMemberCount((c: number) => c + (next ? -1 : 1));
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: next ? `Joined ${club.name}! 🎉` : `Left ${club.name}` });
      }
    });
  };

  const visibleTabs = TABS.filter((t) => !t.requiresApp || club.requiresApp);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/clubs" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        className="relative overflow-hidden rounded-3xl h-[210px]"
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${club.gradientFrom}, ${club.gradientTo})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/30 to-transparent" />
        <div className="absolute inset-0 p-8 flex items-center gap-6">
          <span className="text-[60px] drop-shadow-xl leading-none flex-shrink-0">{club.emoji}</span>
          <div className="flex-1 text-white">
            <h1 className="font-display text-[30px] font-semibold leading-tight">{club.name}</h1>
            {club.tagline && <p className="text-[13.5px] text-white/62 mt-1.5 max-w-lg">{club.tagline}</p>}
            <div className="flex gap-2 mt-3.5 flex-wrap">
              {[
                club.category.charAt(0) + club.category.slice(1).toLowerCase(),
                `⚡ ${club.commitment.charAt(0) + club.commitment.slice(1).toLowerCase()}`,
                `👥 ${memberCount}`,
                ...(club.requiresApp ? ["📋 Apply"] : []),
              ].map((tag) => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-[.05em] px-2.5 py-1 rounded-full bg-white/13 border border-white/18 text-white/84 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleToggle}
              disabled={isPending}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all",
                joined
                  ? "bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm"
                  : "bg-crimson text-white shadow-xl shadow-crimson/40 hover:bg-crimson/90"
              )}
            >
              {joined ? "✓ Leave Club" : "+ Join Club"}
            </motion.button>
            <button className="px-5 py-2 rounded-xl text-[12.5px] font-medium bg-white/12 text-white/84 border border-white/18 hover:bg-white/22 transition-all backdrop-blur-sm">
              📅 Add to Calendar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-px border-b border-border">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-[500] border-b-[2.5px] -mb-px transition-all duration-150",
              tab === t.id
                ? "border-crimson text-crimson"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "overview"      && <OverviewTab club={club} memberCount={memberCount} />}
          {tab === "announcements" && <AnnouncementsTab club={club} canManage={canManage} userId={userId} />}
          {tab === "events"        && <EventsTab club={club} canManage={canManage} />}
          {tab === "members"       && <MembersTab members={club.memberships} />}
          {tab === "resources"     && <ResourcesTab club={club} resources={club.resources} canManage={canManage} />}
          {tab === "applications"  && <ApplicationsTab club={club} userId={userId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ club, memberCount }: { club: any; memberCount: number }) {
  const leaders = club.memberships.filter((m: any) =>
    ["PRESIDENT", "OFFICER", "FACULTY_ADVISOR"].includes(m.role)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-7">
        <Section label="About">
          <p className="text-[14px] text-foreground/80 leading-relaxed">{club.description}</p>
        </Section>

        <Section label="Leadership">
          <div className="space-y-2">
            {leaders.length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground">No leaders listed yet.</p>
            ) : (
              leaders.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.user.image} />
                    <AvatarFallback className="bg-gradient-to-br from-gold to-crimson text-white text-xs font-bold font-display">
                      {initials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">{m.user.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{getClubLeadershipRoleLabel(m.role)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section label="Meeting Schedule">
          {club.meetingDay || club.meetingTime || club.meetingRoom ? (
            <div className="space-y-2">
              {club.meetingDay && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.07em] text-crimson w-14">Day</span>
                  <span className="text-[13.5px] text-foreground">{club.meetingDay}</span>
                </div>
              )}
              {club.meetingTime && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.07em] text-crimson w-14">Time</span>
                  <span className="text-[13.5px] text-foreground">{club.meetingTime}</span>
                </div>
              )}
              {club.meetingRoom && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.07em] text-crimson w-14">Room</span>
                  <span className="text-[13.5px] text-foreground">{club.meetingRoom}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13.5px] text-muted-foreground">No schedule posted.</p>
          )}
        </Section>

        {club.tags.length > 0 && (
          <Section label="Tags">
            <div className="flex gap-2 flex-wrap">
              {club.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-muted rounded-full text-[12px] text-foreground/70">{tag}</span>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground mb-4">Membership</p>
          <div className="text-center py-3">
            <p className="font-display text-[44px] font-semibold text-foreground leading-none">{memberCount}</p>
            <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground mt-1.5">Active Members</p>
          </div>
          {/* Member avatars */}
          <div className="flex justify-center -space-x-1.5 my-3">
            {club.memberships.slice(0, 6).map((m: any, i: number) => (
              <Avatar key={m.id} className="h-7 w-7 ring-2 ring-card" style={{ zIndex: 6 - i }}>
                <AvatarImage src={m.user.image} />
                <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-navy to-crimson text-white">
                  {initials(m.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {memberCount > 6 && (
              <div className="h-7 w-7 rounded-full ring-2 ring-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{memberCount - 6}
              </div>
            )}
          </div>
        </div>

        {club.events.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <p className="text-[13px] font-bold text-foreground mb-3">Next Event</p>
            <div className="bg-crimson/7 rounded-xl p-3.5">
              <p className="text-[12px] font-bold uppercase tracking-[.06em] text-crimson">{format(new Date(club.events[0].startTime), "EEEE")}</p>
              <p className="text-[15px] font-semibold text-foreground mt-0.5">{format(new Date(club.events[0].startTime), "h:mm a")}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{club.events[0].title}</p>
              {club.events[0].location && <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">📍 {club.events[0].location}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ club, canManage, userId }: { club: any; canManage: boolean; userId: string }) {
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState(club.posts);
  const { toast } = useToast();

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setSubmitting(true);
    const result = await createPost(club.id, newPost.title, newPost.content);
    setSubmitting(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result?.post) {
      setPosts([result.post, ...posts]);
      setNewPost({ title: "", content: "" });
      toast({ title: "Posted! ✓" });
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {canManage && (
        <form onSubmit={handlePost} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Post Announcement</p>
          <input
            value={newPost.title}
            onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            placeholder="Announcement title…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <textarea
            value={newPost.content}
            onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
            placeholder="Write your announcement…"
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newPost.title.trim()}
              className="px-5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-4xl opacity-30 mb-3">📣</div>
          <p className="font-display text-[17px] text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        posts.map((post: any, i: number) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
            className="bg-card border border-border rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={post.author?.image} />
                <AvatarFallback className="text-[9px] font-bold bg-muted">{initials(post.author?.name)}</AvatarFallback>
              </Avatar>
              <span className="text-[12.5px] font-semibold text-foreground/80">{post.author?.name}</span>
              <span className="text-[11px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
            </div>
            <h3 className="text-[15px] font-bold text-foreground mb-1.5">{post.title}</h3>
            <p className="text-[13.5px] text-foreground/75 leading-relaxed">{post.content}</p>
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab({ club, canManage }: { club: any; canManage: boolean }) {
  const [events, setEvents] = useState(club.events);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) return;
    setCreating(true);
    const result = await createClubEvent(club.id, form);
    setCreating(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.event) {
      setEvents((current: any[]) =>
        [...current, result.event].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
      );
      setForm({ title: "", location: "", description: "", startTime: "", endTime: "" });
      toast({ title: "Event created ✓" });
    }
  };

  return (
    <div className="space-y-3 max-w-xl">
      {canManage && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Create Event</p>
          <input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="Event title…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
            />
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          </div>
          <input
            value={form.location}
            onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
            placeholder="Location…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Add context for members…"
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !form.title.trim() || !form.startTime || !form.endTime}
              className="px-5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20"
            >
              {creating ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-4xl opacity-30 mb-3">📅</div>
          <p className="font-display text-[17px] text-muted-foreground">No upcoming events</p>
        </div>
      ) : (
        events.map((evt: any, i: number) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
            className="flex gap-4 items-center bg-card border border-border rounded-2xl p-4 shadow-card"
          >
            <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-crimson/8 flex flex-col items-center justify-center">
              <span className="font-display text-[19px] font-semibold text-crimson leading-none">
                {format(new Date(evt.startTime), "d")}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-crimson/60">
                {format(new Date(evt.startTime), "MMM")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground">{evt.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(evt.startTime), "h:mm a")}
                </span>
                {evt.location && (
                  <span className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {evt.location}
                  </span>
                )}
              </div>
              {evt.description && <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{evt.description}</p>}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab({ members }: { members: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
      {members.map((m: any, i: number) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
          className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-card"
        >
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={m.user.image} />
            <AvatarFallback className="bg-gradient-to-br from-navy to-crimson text-white text-xs font-bold">
              {initials(m.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{m.user.name}</p>
            <p className="text-[11px] text-muted-foreground">{getClubLeadershipRoleLabel(m.role)}</p>
          </div>
        </motion.div>
      ))}
      {members.length === 0 && (
        <div className="col-span-full text-center py-14">
          <div className="text-4xl opacity-30 mb-3">👥</div>
          <p className="font-display text-[17px] text-muted-foreground">No members yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────
function ResourcesTab({ club, resources, canManage }: { club: any; resources: any[]; canManage: boolean }) {
  const typeIcon: Record<string, string> = {
    LINK: "🔗", DOCUMENT: "📄", PDF: "📋", SPREADSHEET: "📊", VIDEO: "🎬", OTHER: "📁",
  };
  const [items, setItems] = useState(resources);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    type: "LINK",
  });
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setCreating(true);
    const result = await createClubResource(club.id, form as any);
    setCreating(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.resource) {
      setItems((current: any[]) => [result.resource, ...current]);
      setForm({ name: "", url: "", description: "", type: "LINK" });
      toast({ title: "Resource added ✓" });
    }
  };

  return (
    <div className="space-y-2.5 max-w-lg">
      {canManage && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
          <p className="text-[13px] font-bold text-foreground">Share Resource</p>
          <input
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="Resource title…"
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <input
              value={form.url}
              onChange={(e) => setForm((current) => ({ ...current, url: e.target.value }))}
              placeholder="https://…"
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
            />
            <select
              value={form.type}
              onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}
              className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border transition-all"
            >
              {Object.keys(typeIcon).map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Why members should open this…"
            rows={3}
            className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-crimson/10 transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !form.name.trim() || !form.url.trim()}
              className="px-5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20"
            >
              {creating ? "Adding…" : "Add resource"}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-14">
          <div className="text-4xl opacity-30 mb-3">📁</div>
          <p className="font-display text-[17px] text-muted-foreground">No resources posted</p>
        </div>
      ) : (
        items.map((r: any, i: number) => (
          <motion.a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
            className="flex items-center gap-3.5 bg-card border border-border rounded-xl p-3.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {typeIcon[r.type] ?? "📁"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-foreground group-hover:text-crimson transition-colors">{r.name}</p>
              {r.description && <p className="text-[11.5px] text-muted-foreground">{r.description}</p>}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-crimson transition-colors" />
          </motion.a>
        ))
      )}
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab({ club, userId }: { club: any; userId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const existingApp = club.applications?.[0];
  const form = club.appForm;

  if (existingApp) {
    const statusUI: Record<string, { icon: any; color: string; label: string }> = {
      SUBMITTED:     { icon: AlertCircle,  color: "text-amber-600",   label: "Application Submitted" },
      UNDER_REVIEW:  { icon: AlertCircle,  color: "text-blue-600",    label: "Under Review" },
      ACCEPTED:      { icon: CheckCircle,  color: "text-emerald-600", label: "Accepted" },
      REJECTED:      { icon: XCircle,      color: "text-red-600",     label: "Not Accepted" },
      WAITLISTED:    { icon: AlertCircle,  color: "text-purple-600",  label: "Waitlisted" },
    };
    const ui = statusUI[existingApp.status] ?? statusUI.SUBMITTED;
    return (
      <div className="max-w-md">
        <div className={cn("flex items-center gap-3 p-5 bg-card border border-border rounded-2xl shadow-card", ui.color)}>
          <ui.icon className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[15px]">{ui.label}</p>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Submitted {formatRelativeTime(existingApp.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-display text-[22px] font-semibold text-foreground">Application Submitted</h3>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
          Your application to {club.name} has been received. You&apos;ll hear back within 2 weeks.
        </p>
      </motion.div>
    );
  }

  if (!form || !form.isOpen) {
    return (
      <div className="text-center py-14">
        <div className="text-4xl opacity-30 mb-3">🔒</div>
        <p className="font-display text-[17px] text-muted-foreground">Applications are closed</p>
      </div>
    );
  }

  const fields: any[] = Array.isArray(form.fields) ? form.fields : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitApplication(club.id, responses);
    setSubmitting(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="bg-crimson/5 border border-crimson/15 rounded-2xl p-5">
        <p className="text-[11px] font-bold uppercase tracking-[.08em] text-crimson mb-1.5">Applications Open</p>
        <p className="text-[13px] text-foreground/75 leading-relaxed">
          Submit your application to join {club.name}. All applications are reviewed by club leadership.
          {form.deadline && ` Deadline: ${format(new Date(form.deadline), "MMMM d, yyyy")}.`}
        </p>
      </div>

      {fields.map((field: any) => (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[12.5px] font-semibold text-foreground/80">
            {field.label}
            {field.required && <span className="text-crimson ml-1">*</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              required={field.required}
              placeholder={field.placeholder ?? ""}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] resize-none outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          ) : field.type === "select" ? (
            <select
              required={field.required}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] outline-none focus:border-crimson transition-all"
            >
              <option value="">Select…</option>
              {(field.options ?? []).map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "email" ? "email" : "text"}
              required={field.required}
              placeholder={field.placeholder ?? ""}
              value={responses[field.id] ?? ""}
              onChange={(e) => setResponses((r) => ({ ...r, [field.id]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-[13.5px] outline-none focus:border-crimson focus:ring-2 focus:ring-crimson/10 transition-all"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-crimson text-white rounded-xl text-[14px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-lg shadow-crimson/25"
      >
        {submitting ? "Submitting…" : "Submit Application →"}
      </button>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[.09em] text-muted-foreground/60 mb-3 pb-2.5 border-b border-border">
        {label}
      </p>
      {children}
    </div>
  );
}
