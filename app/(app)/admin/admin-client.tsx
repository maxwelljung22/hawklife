// app/(app)/admin/admin-client.tsx
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Building2, FileText, Scroll,
  GraduationCap, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, ShieldCheck,
  BarChart3, TrendingUp, AlertTriangle, Flag, BellDot, History, ClipboardList, Sparkles,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateApplicationStatus,
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  deleteClubAdmin,
  setClubFlag,
  updateUserRole,
  assignClubLeadership,
  removeClubLeadership,
  approveClubEditRequest,
  denyClubEditRequest,
} from "./actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { NhsRecord } from "@/lib/airtable";
import { canAccessAdmin, getClubLeadershipRoleLabel, getRoleBadgeClass, getRoleLabel } from "@/lib/roles";

type AdminTab = "overview" | "requests" | "activity" | "clubs" | "users" | "applications" | "changelog" | "nhs";

interface Props {
  clubs: any[];
  users: any[];
  applications: any[];
  changelog: any[];
  nhsRecords: NhsRecord[];
  currentRole: any;
  analytics: {
    totalEvents: number;
    attendanceCount: number;
    participatingStudents: number;
    advisorClubIds: string[];
  };
}

const TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: "overview",      label: "Overview",     icon: BarChart3    },
  { id: "requests",      label: "Requests",     icon: ClipboardList },
  { id: "activity",      label: "Activity",     icon: History      },
  { id: "clubs",         label: "Clubs",        icon: Building2    },
  { id: "users",         label: "Users",        icon: Users        },
  { id: "applications",  label: "Applications", icon: FileText     },
  { id: "changelog",     label: "Changelog",    icon: Scroll       },
  { id: "nhs",           label: "NHS Data",     icon: GraduationCap},
];

export function AdminClient({ clubs, users, applications, changelog, nhsRecords, currentRole, analytics }: Props) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const isAdmin = canAccessAdmin(currentRole);
  const pendingApplications = applications.filter((application) => ["SUBMITTED", "UNDER_REVIEW"].includes(application.status));
  const pendingClubRequests = clubs.filter((club) => club.pendingEditStatus === "PENDING" && club.pendingEditRequest);
  const flaggedClubs = clubs.filter((club) => club.isFlagged);
  const recentActivity = buildAdminActivity({ clubs, users, applications, changelog });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:items-center">
        <div className="h-8 w-8 rounded-lg bg-crimson/10 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-crimson" />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[.09em] text-crimson">{isAdmin ? "Administration" : "Faculty Controls"}</p>
          <h1 className="font-display text-[28px] font-semibold text-foreground tracking-tight leading-none">{isAdmin ? "Admin Panel" : "Faculty Controls"}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-px border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-[13px] font-[500] border-b-[2.5px] -mb-px whitespace-nowrap transition-all",
              tab === t.id ? "border-crimson text-crimson" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.id === "applications" && applications.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-crimson text-white rounded-full text-[10px] font-bold">{applications.length}</span>
            )}
            {t.id === "requests" && pendingApplications.length + pendingClubRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-crimson text-white rounded-full text-[10px] font-bold">
                {pendingApplications.length + pendingClubRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview"     && <OverviewTab clubs={clubs} users={users} applications={applications} nhsRecords={nhsRecords} analytics={analytics} changelog={changelog} />}
          {tab === "requests"     && <RequestsTab clubs={clubs} applications={applications} />}
          {tab === "activity"     && <ActivityTab items={recentActivity} flaggedClubs={flaggedClubs} pendingClubRequests={pendingClubRequests} />}
          {tab === "clubs"        && <ClubsTab clubs={clubs} canArchive={isAdmin} canFlag />}
          {tab === "users"        && <UsersTab users={users} clubs={clubs} canManageUsers={isAdmin} />}
          {tab === "applications" && <ApplicationsTab applications={applications} canReview={isAdmin} />}
          {tab === "changelog"    && <ChangelogTab entries={changelog} />}
          {tab === "nhs"          && <NhsTab records={nhsRecords} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ clubs, users, applications, nhsRecords, analytics, changelog }: any) {
  const activeClubs   = clubs.filter((c: any) => c.isActive).length;
  const totalMembers  = users.length;
  const pendingApps   = applications.filter((application: any) => ["SUBMITTED", "UNDER_REVIEW"].includes(application.status)).length;
  const nhsComplete   = nhsRecords.filter((r: NhsRecord) => r.status === "complete").length;
  const flaggedClubs = clubs.filter((club: any) => club.isFlagged).length;
  const pendingClubRequests = clubs.filter((club: any) => club.pendingEditStatus === "PENDING" && club.pendingEditRequest).length;
  const recentUsers = users.slice(0, 5);
  const recentClubRequests = clubs
    .filter((club: any) => club.pendingEditStatus === "PENDING" && club.pendingEditSubmittedAt)
    .sort((a: any, b: any) => +new Date(b.pendingEditSubmittedAt) - +new Date(a.pendingEditSubmittedAt))
    .slice(0, 4);
  const recentUpdates = changelog.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { icon: Building2,   val: activeClubs,  label: "Active Clubs",      color: "text-crimson bg-crimson/8" },
          { icon: Users,       val: analytics.participatingStudents, label: "Student Participation", color: "text-navy bg-navy/8"       },
          { icon: FileText,    val: pendingApps,  label: "Pending Apps",       color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
          { icon: GraduationCap,val: nhsComplete, label: "NHS Complete",       color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
          { icon: ClipboardList,val: pendingClubRequests, label: "Edit Requests", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
          { icon: Flag,        val: flaggedClubs, label: "Flagged Clubs",      color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20" },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-4", color)}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-display text-[32px] font-semibold text-foreground leading-none">{val}</p>
            <p className="text-[11px] font-bold uppercase tracking-[.06em] text-muted-foreground mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top clubs by membership */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground mb-4">Club activity levels</p>
          <div className="space-y-3">
            {[...clubs].sort((a: any, b: any) => (b._count.posts + b._count.events) - (a._count.posts + a._count.events)).slice(0, 6).map((club: any) => (
              <div key={club.id} className="flex items-center gap-3">
                <span className="text-lg">{club.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{club.name}</p>
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-crimson/70 rounded-full"
                      style={{ width: `${Math.min(100, ((club._count.posts + club._count.events) / Math.max(...clubs.map((c: any) => c._count.posts + c._count.events), 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[12px] font-bold text-muted-foreground">{club._count.posts + club._count.events}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Faculty controls stats */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground mb-4">Moderation & analytics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Events tracked</p>
              <p className="mt-1 text-[20px] font-semibold text-foreground">{analytics.totalEvents}</p>
            </div>
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Attendance records</p>
              <p className="mt-1 text-[20px] font-semibold text-foreground">{analytics.attendanceCount}</p>
            </div>
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Pending edit requests</p>
              <p className="mt-1 text-[20px] font-semibold text-foreground">{pendingClubRequests}</p>
            </div>
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Total users</p>
              <p className="mt-1 text-[20px] font-semibold text-foreground">{totalMembers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2">
            <BellDot className="h-4 w-4 text-crimson" />
            <p className="text-[13px] font-bold text-foreground">Club edit requests</p>
          </div>
          <div className="mt-4 space-y-3">
            {recentClubRequests.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No club edit requests are waiting right now.</p>
            ) : recentClubRequests.map((club: any) => (
              <div key={club.id} className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-[13px] font-semibold text-foreground">{club.name}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Submitted {formatRelativeTime(club.pendingEditSubmittedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-crimson" />
            <p className="text-[13px] font-bold text-foreground">Newest users</p>
          </div>
          <div className="mt-4 space-y-3">
            {recentUsers.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{user.name ?? "Unnamed user"}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", getRoleBadgeClass(user.role))}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-crimson" />
            <p className="text-[13px] font-bold text-foreground">Recent updates</p>
          </div>
          <div className="mt-4 space-y-3">
            {recentUpdates.map((entry: any) => (
              <div key={entry.id} className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-[13px] font-semibold text-foreground">{entry.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{formatRelativeTime(entry.publishedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsTab({ clubs, applications }: { clubs: any[]; applications: any[] }) {
  const pendingClubRequests = clubs
    .filter((club) => club.pendingEditStatus === "PENDING" && club.pendingEditRequest)
    .sort((a, b) => +new Date(b.pendingEditSubmittedAt ?? 0) - +new Date(a.pendingEditSubmittedAt ?? 0));
  const pendingApplications = applications.filter((application) => ["SUBMITTED", "UNDER_REVIEW"].includes(application.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground">Club Edit Requests</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Submitted club updates that need review or approval.</p>
          <div className="mt-4 space-y-3">
            {pendingClubRequests.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-4 py-4 text-[12px] text-muted-foreground">No pending club edit requests.</div>
            ) : pendingClubRequests.map((club) => (
              <div key={club.id} className="rounded-xl border border-border bg-muted/30 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{club.name}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Requested {formatRelativeTime(club.pendingEditSubmittedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                    Pending
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-muted-foreground">
                  <p>Requested slug: {(club.pendingEditRequest as any)?.slug || club.slug}</p>
                  <p>Requested title: {(club.pendingEditRequest as any)?.name || club.name}</p>
                  <p className="line-clamp-2">{(club.pendingEditRequest as any)?.tagline || "No new tagline provided."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <p className="text-[13px] font-bold text-foreground">Application Review Queue</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Student applications that are still awaiting an admin decision.</p>
          <div className="mt-4 space-y-3">
            {pendingApplications.length === 0 ? (
              <div className="rounded-xl bg-muted/40 px-4 py-4 text-[12px] text-muted-foreground">No pending applications.</div>
            ) : pendingApplications.slice(0, 8).map((application) => (
              <div key={application.id} className="rounded-xl border border-border bg-muted/30 px-4 py-4">
                <p className="text-[13.5px] font-semibold text-foreground">{application.applicant.name}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {application.club.emoji} {application.club.name} · {formatRelativeTime(application.createdAt)}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  {application.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  items,
  flaggedClubs,
  pendingClubRequests,
}: {
  items: Array<{ id: string; title: string; detail: string; time: Date; kind: string }>;
  flaggedClubs: any[];
  pendingClubRequests: any[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground">Flag Review</p>
          <p className="mt-2 text-[28px] font-semibold text-foreground">{flaggedClubs.length}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">clubs currently flagged for admin attention</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground">Request Queue</p>
          <p className="mt-2 text-[28px] font-semibold text-foreground">{pendingClubRequests.length}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">club edit requests waiting for review</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground">Recent Activity</p>
          <p className="mt-2 text-[28px] font-semibold text-foreground">{items.length}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">latest objects across HawkLife admin workflows</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
        <p className="text-[13px] font-bold text-foreground">Activity Feed</p>
        <p className="mt-1 text-[12px] text-muted-foreground">A lightweight audit-style timeline built from recent user, club, application, and changelog activity.</p>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
              <div className="mt-0.5 rounded-full bg-crimson/10 p-2 text-crimson">
                <History className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13.5px] font-semibold text-foreground">{item.title}</p>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(item.time)}</span>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">{item.detail}</p>
                <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.06em] text-muted-foreground">
                  {item.kind}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getClubRatings(club: any) {
  const memberCount = club._count.memberships ?? 0;
  const activityCount = (club._count.posts ?? 0) + (club._count.events ?? 0);
  const ageDays = Math.max(1, Math.floor((Date.now() - +new Date(club.createdAt)) / 86_400_000));

  const memberRetention = memberCount >= 40 ? { value: "Elite", score: 5 } : memberCount >= 24 ? { value: "Strong", score: 4 } : memberCount >= 12 ? { value: "Stable", score: 3 } : memberCount >= 6 ? { value: "Weak", score: 2 } : { value: "Fragile", score: 1 };
  const recentGrowth = ageDays <= 45 && memberCount >= 15 ? { value: "Rapid", score: 5 } : memberCount >= 20 ? { value: "Healthy", score: 4 } : memberCount >= 10 ? { value: "Slow", score: 3 } : memberCount >= 5 ? { value: "Early", score: 2 } : { value: "Stalled", score: 1 };
  const activity = activityCount >= 16 ? { value: "Thriving", score: 5 } : activityCount >= 10 ? { value: "Active", score: 4 } : activityCount >= 5 ? { value: "Steady", score: 3 } : activityCount >= 2 ? { value: "Sparse", score: 2 } : { value: "Dormant", score: 1 };
  const establishment = ageDays >= 365 ? { value: "Established", score: 5 } : ageDays >= 180 ? { value: "Grounded", score: 4 } : ageDays >= 90 ? { value: "Emerging", score: 3 } : ageDays >= 30 ? { value: "New", score: 2 } : { value: "Launching", score: 1 };
  const policyCompliance = club.isFlagged ? { value: "Risk", score: 1 } : club.pendingEditStatus === "PENDING" ? { value: "Review", score: 3 } : { value: "Model", score: 5 };
  const futureOpportunities = club.requiresApp && memberCount < 12 ? { value: "Selective", score: 3 } : activityCount >= 8 || memberCount >= 20 ? { value: "Promising", score: 4 } : club.tags?.length >= 3 ? { value: "Hopeful", score: 3 } : { value: "Building", score: 2 };

  const criteria = [
    { key: "memberRetention", label: "Member Retention", ...memberRetention },
    { key: "recentGrowth", label: "Recent Growth", ...recentGrowth },
    { key: "activity", label: "Activity", ...activity },
    { key: "establishment", label: "Establishment", ...establishment },
    { key: "policyCompliance", label: "Policy Compliance", ...policyCompliance },
    { key: "futureOpportunities", label: "Future Opportunities", ...futureOpportunities },
  ];

  const average = criteria.reduce((sum, item) => sum + item.score, 0) / criteria.length;
  const aggregate = average >= 4.5 ? "Exceptional" : average >= 3.7 ? "Strong" : average >= 2.8 ? "Average" : average >= 2 ? "Developing" : "At Risk";

  return { aggregate, criteria };
}

function ClubRatingCard({ club }: { club: any }) {
  const rating = getClubRatings(club);

  return (
    <div className="rounded-[22px] border border-border bg-[linear-gradient(180deg,rgba(20,20,24,0.96),rgba(30,30,36,0.96))] px-4 py-4 text-white shadow-[0_16px_42px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-white/55">{club.name} Aggregate Rating</p>
          <p className="mt-1 text-[22px] font-semibold tracking-[-0.05em] text-[#7da7ff]">{rating.aggregate}</p>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[.12em] text-white/35">Health Snapshot</div>
      </div>
      <div className="mt-4 divide-y divide-white/8 overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.04]">
        {rating.criteria.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12px]">
            <span className="text-white/78">{item.label}</span>
            <span className="font-semibold text-white">{item.value ?? item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clubs Tab ────────────────────────────────────────────────────────────────
function ClubsTab({ clubs, canArchive, canFlag }: { clubs: any[]; canArchive: boolean; canFlag: boolean }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const pendingRequests = clubs.filter((club) => club.pendingEditStatus === "PENDING" && club.pendingEditRequest);
  const ratedClubs = [...clubs]
    .sort((a, b) => (b._count.memberships + b._count.posts + b._count.events) - (a._count.memberships + a._count.posts + a._count.events))
    .slice(0, 3);

  const handleDelete = (clubId: string, clubName: string) => {
    if (!confirm(`Archive "${clubName}"? This will hide it from students.`)) return;
    startTransition(async () => {
      const result = await deleteClubAdmin(clubId);
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: `"${clubName}" archived ✓` });
    });
  };

  const handleFlag = (clubId: string, clubName: string, flagged: boolean) => {
    startTransition(async () => {
      const result = await setClubFlag(clubId, flagged, flagged ? `Flagged by faculty controls for ${clubName}.` : "");
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: flagged ? "Club flagged" : "Club unflagged" });
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        {ratedClubs.map((club) => (
          <ClubRatingCard key={club.id} club={club} />
        ))}
      </div>
      {pendingRequests.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <p className="text-[12px] font-bold uppercase tracking-[.08em] text-muted-foreground">Pending Club Edit Requests</p>
          <div className="mt-4 space-y-3">
            {pendingRequests.map((club) => (
              <div key={club.id} className="rounded-xl border border-border/80 bg-background/70 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-foreground">{club.name}</p>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      Requested URL: {(club.pendingEditRequest as any)?.slug || club.slug}
                    </p>
                    <p className="mt-2 text-[12.5px] leading-6 text-muted-foreground">
                      {(club.pendingEditRequest as any)?.tagline || "No new tagline provided."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const result = await approveClubEditRequest(club.id);
                          if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
                          else toast({ title: "Club edit request approved" });
                        })
                      }
                      disabled={pending}
                      className="rounded-xl bg-neutral-950 px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const result = await denyClubEditRequest(club.id);
                          if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
                          else toast({ title: "Club edit request denied" });
                        })
                      }
                      disabled={pending}
                      className="rounded-xl border border-border bg-card px-3.5 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Link
          href="/admin/clubs/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-crimson px-4 py-2.5 text-[13.5px] font-medium text-white shadow-md shadow-crimson/20 transition-all hover:bg-crimson/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> New Club
        </Link>
      </div>
      <div className="space-y-3 md:hidden">
        {clubs.map((club, i) => (
          <motion.div key={club.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.02 } }} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{club.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-foreground">{club.name}</p>
                    {club.tagline && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{club.tagline}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", club.isActive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-muted-foreground bg-muted")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", club.isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                    {club.isActive ? "Active" : "Archived"}
                  </span>
                  {club.isFlagged && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">Flagged</span>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {club.category.charAt(0) + club.category.slice(1).toLowerCase()}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {club._count.memberships} members
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {club._count.posts} posts
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {canArchive ? (
                    <Link href={`/admin/clubs/${club.id}/edit`} className="flex-1 rounded-xl border border-border px-3 py-2 text-center text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted">
                      Edit
                    </Link>
                  ) : null}
                  {canFlag && (
                    <button onClick={() => handleFlag(club.id, club.name, !club.isFlagged)} disabled={pending} className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20">
                      {club.isFlagged ? "Unflag" : "Flag"}
                    </button>
                  )}
                  {canArchive && (
                    <button onClick={() => handleDelete(club.id, club.name)} disabled={pending} className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20">
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="hidden bg-card border border-border rounded-2xl overflow-hidden shadow-card md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Club", "Category", "Members", "Posts", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[.07em] text-muted-foreground px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clubs.map((club, i) => (
              <motion.tr key={club.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.02 } }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{club.emoji}</span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">{club.name}</p>
                      {club.tagline && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{club.tagline}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 bg-muted rounded-full text-[11.5px] text-muted-foreground">
                    {club.category.charAt(0) + club.category.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[13.5px] font-semibold text-foreground">{club._count.memberships}</td>
                <td className="px-5 py-3.5 text-[13.5px] text-muted-foreground">{club._count.posts}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("flex items-center gap-1.5 text-[11.5px] font-medium w-fit px-2 py-0.5 rounded-full", club.isActive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-muted-foreground bg-muted")}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", club.isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                    {club.isActive ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {canArchive ? (
                      <>
                        <Link href={`/admin/clubs/${club.id}/edit`} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(club.id, club.name)} disabled={pending} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : null}
                    {canFlag ? (
                      <button onClick={() => handleFlag(club.id, club.name, !club.isFlagged)} disabled={pending} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-muted-foreground hover:text-amber-700">
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users, clubs, canManageUsers }: { users: any[]; clubs: any[]; canManageUsers: boolean }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [leadershipForm, setLeadershipForm] = useState<Record<string, { clubId: string; role: "OFFICER" | "PRESIDENT" | "FACULTY_ADVISOR" }>>({});

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole as any);
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: "Role updated ✓" });
    });
  };

  const handleLeadershipAssign = (userId: string) => {
    const selection = leadershipForm[userId];
    if (!selection?.clubId) return;
    startTransition(async () => {
      const result = await assignClubLeadership(userId, selection.clubId, selection.role);
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: "Club leadership updated ✓" });
    });
  };

  const handleLeadershipRemove = (userId: string, clubId: string) => {
    startTransition(async () => {
      const result = await removeClubLeadership(userId, clubId);
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: "Club leadership removed ✓" });
    });
  };

  return (
    <>
    <div className="space-y-3 md:hidden">
      {users.map((user, i) => (
        <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.02 } }} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-navy to-crimson text-white">
                {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-foreground">{user.name ?? "Unnamed"}</p>
              <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px]">
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="text-muted-foreground">Clubs</p>
                  <p className="mt-0.5 font-semibold text-foreground">{user._count.memberships}</p>
                </div>
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="text-muted-foreground">Joined</p>
                  <p className="mt-0.5 font-semibold text-foreground">{formatRelativeTime(user.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3">
                <select
                  defaultValue={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={pending || !canManageUsers}
                  className={cn(
                    "w-full cursor-pointer rounded-xl border-none px-3 py-2 text-[12px] font-medium outline-none",
                    getRoleBadgeClass(user.role)
                  )}
                >
                  <option value="STUDENT">student</option>
                  <option value="FACULTY">faculty</option>
                  <option value="ADMIN">admin</option>
                </select>
              </div>
              {!canManageUsers ? <p className="mt-2 text-[11px] text-muted-foreground">Faculty can monitor users, but only admins can change global roles.</p> : null}
              <div className="mt-3 rounded-xl bg-muted/50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Club leadership</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.memberships?.filter((membership: any) => ["OFFICER", "PRESIDENT", "FACULTY_ADVISOR"].includes(membership.role)).length ? (
                    user.memberships
                      .filter((membership: any) => ["OFFICER", "PRESIDENT", "FACULTY_ADVISOR"].includes(membership.role))
                      .map((membership: any) => (
                        <button
                          key={membership.id}
                          onClick={() => handleLeadershipRemove(user.id, membership.club.id)}
                          disabled={pending || !canManageUsers}
                          className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-foreground transition-colors hover:bg-muted"
                        >
                          {membership.club.emoji} {membership.club.name} · {getClubLeadershipRoleLabel(membership.role)} ×
                        </button>
                      ))
                  ) : (
                    <span className="text-[11.5px] text-muted-foreground">No club leadership assigned</span>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_132px_auto]">
                  <select
                    value={leadershipForm[user.id]?.clubId ?? ""}
                    onChange={(e) => setLeadershipForm((current) => ({ ...current, [user.id]: { clubId: e.target.value, role: current[user.id]?.role ?? "OFFICER" } }))}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] text-foreground outline-none"
                  >
                    <option value="">Choose club…</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </select>
                  <select
                    value={leadershipForm[user.id]?.role ?? "OFFICER"}
                    onChange={(e) => setLeadershipForm((current) => ({ ...current, [user.id]: { clubId: current[user.id]?.clubId ?? "", role: e.target.value as "OFFICER" | "PRESIDENT" | "FACULTY_ADVISOR" } }))}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-[12px] text-foreground outline-none"
                  >
                    <option value="OFFICER">student leader</option>
                    <option value="PRESIDENT">president</option>
                    <option value="FACULTY_ADVISOR">faculty advisor</option>
                  </select>
                  <button
                    onClick={() => handleLeadershipAssign(user.id)}
                    disabled={!canManageUsers || pending || !leadershipForm[user.id]?.clubId}
                    className="rounded-xl bg-crimson px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="hidden bg-card border border-border rounded-2xl overflow-hidden shadow-card md:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {["User", "Email", "Role", "Clubs", "Joined", ""].map((h) => (
              <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[.07em] text-muted-foreground px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.02 } }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-navy to-crimson text-white">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[13.5px] font-semibold text-foreground">{user.name ?? "Unnamed"}</p>
                </div>
              </td>
              <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{user.email}</td>
              <td className="px-5 py-3.5">
                <select
                  defaultValue={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={pending || !canManageUsers}
                  className={cn(
                    "text-[11.5px] font-medium px-2 py-1 rounded-full border-none outline-none cursor-pointer",
                    getRoleBadgeClass(user.role)
                  )}
                >
                  <option value="STUDENT">student</option>
                  <option value="FACULTY">faculty</option>
                  <option value="ADMIN">admin</option>
                </select>
              </td>
              <td className="px-5 py-3.5 text-[13.5px] font-semibold text-foreground">{user._count.memberships}</td>
              <td className="px-5 py-3.5 text-[12px] text-muted-foreground">{formatRelativeTime(user.createdAt)}</td>
              <td className="px-5 py-3.5">
                <div className="min-w-[280px] space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {user.memberships?.filter((membership: any) => ["OFFICER", "PRESIDENT", "FACULTY_ADVISOR"].includes(membership.role)).length ? (
                      user.memberships
                        .filter((membership: any) => ["OFFICER", "PRESIDENT", "FACULTY_ADVISOR"].includes(membership.role))
                        .map((membership: any) => (
                          <button
                            key={membership.id}
                            onClick={() => handleLeadershipRemove(user.id, membership.club.id)}
                            disabled={pending || !canManageUsers}
                            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] text-foreground transition-colors hover:bg-card"
                          >
                            {membership.club.name} · {getClubLeadershipRoleLabel(membership.role)} ×
                          </button>
                        ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No club leadership</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={leadershipForm[user.id]?.clubId ?? ""}
                      onChange={(e) => setLeadershipForm((current) => ({ ...current, [user.id]: { clubId: e.target.value, role: current[user.id]?.role ?? "OFFICER" } }))}
                      className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[11.5px] text-foreground outline-none"
                    >
                      <option value="">Choose club…</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                      ))}
                    </select>
                    <select
                      value={leadershipForm[user.id]?.role ?? "OFFICER"}
                      onChange={(e) => setLeadershipForm((current) => ({ ...current, [user.id]: { clubId: current[user.id]?.clubId ?? "", role: e.target.value as "OFFICER" | "PRESIDENT" | "FACULTY_ADVISOR" } }))}
                      className="rounded-xl border border-border bg-card px-3 py-2 text-[11.5px] text-foreground outline-none"
                    >
                      <option value="OFFICER">student leader</option>
                      <option value="PRESIDENT">president</option>
                      <option value="FACULTY_ADVISOR">faculty advisor</option>
                    </select>
                    <button
                      onClick={() => handleLeadershipAssign(user.id)}
                      disabled={!canManageUsers || pending || !leadershipForm[user.id]?.clubId}
                      className="rounded-xl bg-crimson px-3 py-2 text-[11.5px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab({ applications, canReview }: { applications: any[]; canReview: boolean }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const counts = {
    accepted: applications.filter((app) => app.status === "ACCEPTED").length,
    rejected: applications.filter((app) => app.status === "REJECTED").length,
    underReview: applications.filter((app) => app.status === "UNDER_REVIEW").length,
    submitted: applications.filter((app) => app.status === "SUBMITTED").length,
  };

  const handle = (id: string, status: string, name: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatus(id, status as any);
      if (result?.error) toast({ title: "Error", description: result.error, variant: "destructive" });
      else toast({ title: `Application ${status.toLowerCase()} ✓` });
    });
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl opacity-30 mb-3">📋</div>
        <p className="font-display text-[18px] text-muted-foreground">No pending applications</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Submitted", value: counts.submitted },
          { label: "Under review", value: counts.underReview },
          { label: "Accepted", value: counts.accepted },
          { label: "Rejected", value: counts.rejected },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-[22px] font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
      {applications.map((app, i) => (
        <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3.5">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={app.applicant.image} />
                <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-navy to-crimson text-white">
                  {app.applicant.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{app.applicant.name}</p>
                <p className="text-[12px] text-muted-foreground">{app.applicant.email}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {app.club.emoji} Applying to <span className="font-medium text-foreground">{app.club.name}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">{formatRelativeTime(app.createdAt)}</p>
              </div>
            </div>
            {canReview ? (
              <div className="flex flex-col gap-2 sm:flex-row md:flex-shrink-0">
                <button
                  onClick={() => handle(app.id, "ACCEPTED", app.applicant.name)}
                  disabled={pending}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[12.5px] font-medium hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Accept
                </button>
                <button
                  onClick={() => handle(app.id, "REJECTED", app.applicant.name)}
                  disabled={pending}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-[12.5px] font-medium hover:bg-red-100 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" /> Decline
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-muted px-3 py-2 text-[12px] text-muted-foreground">Advisor oversight only</div>
            )}
          </div>
          {/* Show responses */}
          {Object.keys(app.responses).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {Object.entries(app.responses).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[11px] font-bold uppercase tracking-[.07em] text-muted-foreground">{key}</p>
                  <p className="text-[13px] text-foreground/80 mt-0.5">{String(val)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Changelog Tab ────────────────────────────────────────────────────────────
function ChangelogTab({ entries }: { entries: any[] }) {
  const [form, setForm] = useState({ title: "", content: "", type: "FEATURE", isFeatured: false });
  const [submitting, setSubmitting] = useState(false);
  const [localEntries, setLocalEntries] = useState(entries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", type: "FEATURE", isFeatured: false });
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  const TYPES = ["FEATURE", "IMPROVEMENT", "BUG_FIX", "CLUB_UPDATE", "ANNOUNCEMENT"];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await createChangelogEntry(form);
    setSubmitting(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result?.entry) {
      setLocalEntries([result.entry, ...localEntries]);
      setForm({ title: "", content: "", type: "FEATURE", isFeatured: false });
      toast({ title: "Changelog entry published ✓" });
    }
  };

  const handleStartEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditForm({
      title: entry.title,
      content: entry.content,
      type: entry.type,
      isFeatured: entry.isFeatured,
    });
  };

  const handleSaveEdit = async (entryId: string) => {
    setSavingEdit(true);
    const result = await updateChangelogEntry(entryId, editForm);
    setSavingEdit(false);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    if (result?.entry) {
      setLocalEntries((current: any[]) => current.map((entry) => (entry.id === entryId ? result.entry : entry)));
      setEditingId(null);
      toast({ title: "Changelog updated ✓" });
    }
  };

  const handleDelete = async (entryId: string) => {
    const result = await deleteChangelogEntry(entryId);
    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }
    setLocalEntries((current: any[]) => current.filter((entry) => entry.id !== entryId));
    toast({ title: "Changelog deleted" });
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4 sm:p-6">
        <p className="text-[13px] font-bold text-foreground">Post New Update</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground">Title</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="What changed?" className="w-full px-3.5 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3.5 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border transition-all">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-muted-foreground">Content (HTML supported)</label>
          <textarea required rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="<p>Describe the update…</p>" className="w-full px-3.5 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border font-mono transition-all" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="accent-crimson" />
            <span className="text-[13px] text-muted-foreground">Feature on dashboard</span>
          </label>
          <button type="submit" disabled={submitting || !form.title.trim()} className="w-full rounded-xl bg-crimson px-5 py-2 text-[13px] font-medium text-white shadow-md shadow-crimson/20 transition-all hover:bg-crimson/90 disabled:opacity-50 sm:w-auto">
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>

      {/* Existing entries */}
      <div className="space-y-3">
        {localEntries.map((entry, i) => (
          <div key={entry.id} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            {editingId === entry.id ? (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((current) => ({ ...current, title: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-[13.5px] outline-none focus:bg-card"
                  />
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((current) => ({ ...current, type: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-[13.5px] outline-none focus:bg-card"
                  >
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={editForm.content}
                  onChange={(e) => setEditForm((current) => ({ ...current, content: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-[13.5px] outline-none focus:bg-card"
                />
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) => setEditForm((current) => ({ ...current, isFeatured: e.target.checked }))}
                    className="accent-crimson"
                  />
                  Feature on dashboard
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-xl border border-border px-4 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(entry.id)}
                    disabled={savingEdit}
                    className="rounded-xl bg-crimson px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-crimson/90 disabled:opacity-50"
                  >
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.07em] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{entry.type.replace("_", " ")}</span>
                    {entry.isFeatured && <span className="text-[10px] font-bold uppercase tracking-[.06em] px-2 py-0.5 rounded-full bg-crimson/10 text-crimson">Featured</span>}
                  </div>
                  <p className="text-[14px] font-bold text-foreground">{entry.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{formatRelativeTime(entry.publishedAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(entry)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Edit changelog entry"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Delete changelog entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NHS Tab ──────────────────────────────────────────────────────────────────
function NhsTab({ records }: { records: NhsRecord[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] font-bold text-foreground">NHS Hours — {records.length} students</p>
        <Link href="/nhs" className="text-[12.5px] text-crimson hover:opacity-70 transition-opacity">Open full view →</Link>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {records.slice(0, 20).map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-foreground">{r.studentName}</p>
                <p className="text-[12px] text-muted-foreground">{r.grade ? `Grade ${r.grade}` : "No grade listed"}</p>
              </div>
              <span className={cn("text-[11.5px] font-semibold capitalize", {
                "text-emerald-600": r.status === "complete",
                "text-blue-600": r.status === "on_track",
                "text-amber-600": r.status === "behind",
                "text-muted-foreground": r.status === "not_required",
              })}>{r.status.replace("_", " ")}</span>
            </div>
            <p className="mt-3 font-display text-[16px] font-semibold text-foreground">{r.totalHours}/{r.requiredHours}</p>
          </div>
        ))}
      </div>
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border">
            {["Student", "Grade", "Hours", "Status"].map((h) => (
              <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[.07em] text-muted-foreground px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.slice(0, 20).map((r, i) => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="px-5 py-3 text-[13.5px] font-medium text-foreground">{r.studentName}</td>
              <td className="px-5 py-3 text-[13px] text-muted-foreground">{r.grade ? `Grade ${r.grade}` : "—"}</td>
              <td className="px-5 py-3 font-display text-[15px] font-semibold text-foreground">{r.totalHours}/{r.requiredHours}</td>
              <td className="px-5 py-3">
                <span className={cn("text-[11.5px] font-semibold capitalize", {
                  "text-emerald-600": r.status === "complete",
                  "text-blue-600":    r.status === "on_track",
                  "text-amber-600":   r.status === "behind",
                  "text-muted-foreground": r.status === "not_required",
                })}>{r.status.replace("_", " ")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildAdminActivity({
  clubs,
  users,
  applications,
  changelog,
}: {
  clubs: any[];
  users: any[];
  applications: any[];
  changelog: any[];
}) {
  return [
    ...clubs.slice(0, 8).map((club) => ({
      id: `club-${club.id}`,
      title: `${club.name} updated`,
      detail: club.pendingEditStatus === "PENDING"
        ? "A club edit request is waiting for admin review."
        : club.isFlagged
          ? club.flagReason || "Club is currently flagged for review."
          : "Club details or moderation state changed recently.",
      time: new Date(club.updatedAt),
      kind: club.pendingEditStatus === "PENDING" ? "club request" : "club",
    })),
    ...users.slice(0, 8).map((user) => ({
      id: `user-${user.id}`,
      title: `${user.name ?? "Unnamed user"} joined HawkLife`,
      detail: `${user.email ?? "No email"} · ${getRoleLabel(user.role)}`,
      time: new Date(user.createdAt),
      kind: "user",
    })),
    ...applications.slice(0, 8).map((application) => ({
      id: `application-${application.id}`,
      title: `${application.applicant.name ?? "Student"} applied to ${application.club.name}`,
      detail: `Application is currently ${application.status.replace("_", " ").toLowerCase()}.`,
      time: new Date(application.createdAt),
      kind: "application",
    })),
    ...changelog.slice(0, 8).map((entry) => ({
      id: `changelog-${entry.id}`,
      title: `Changelog published: ${entry.title}`,
      detail: `${entry.type.replace("_", " ")} update posted to HawkLife.`,
      time: new Date(entry.publishedAt ?? entry.createdAt),
      kind: "changelog",
    })),
  ]
    .sort((a, b) => +b.time - +a.time)
    .slice(0, 18);
}
