// app/(app)/nhs/nhs-client.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, TrendingUp, AlertTriangle, MinusCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { syncNhs } from "./actions";
import { useToast } from "@/hooks/use-toast";
import type { NhsRecord } from "@/lib/airtable";

interface Props {
  myRecord: NhsRecord | null;
  allRecords: NhsRecord[] | null;
  isAdmin: boolean;
  userEmail: string;
}

const STATUS_CONFIG = {
  complete:     { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Complete",     bar: "bg-emerald-500" },
  on_track:     { icon: TrendingUp,   color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20",       label: "On Track",    bar: "bg-blue-500"    },
  behind:       { icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20",     label: "Behind",      bar: "bg-amber-500"   },
  not_required: { icon: MinusCircle,  color: "text-muted-foreground", bg: "bg-muted",                        label: "N/A",         bar: "bg-muted"       },
} as const;

export function NhsClient({ myRecord, allRecords, isAdmin, userEmail }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncNhs();
    setSyncing(false);
    if (result?.error) {
      toast({ title: "Sync failed", description: result.error, variant: "destructive" });
    } else if (result && "synced" in result) {
      toast({ title: `Synced ${result.synced} records ✓` });
    } else {
      toast({ title: "Sync finished" });
    }
  };

  const filteredAll = (allRecords ?? []).filter((r) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return r.studentName.toLowerCase().includes(q) || r.studentEmail?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">St. Joseph&apos;s Preparatory</p>
          <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
            NHS <span className="italic">Hours</span>
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            Service hours data — live from Airtable.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 border border-border bg-card rounded-xl text-[13.5px] font-medium hover:bg-muted transition-colors shadow-card"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
      </div>

      {/* Personal Record */}
      {myRecord && myRecord.status !== "not_required" && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
          <MyNhsCard record={myRecord} />
        </motion.div>
      )}

      {myRecord && myRecord.status === "not_required" && !isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
          <div className="text-4xl mb-3 opacity-30">🎓</div>
          <p className="font-display text-[18px] text-muted-foreground">NHS hours are tracked for Juniors and Seniors</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1.5">Check back in your junior year.</p>
        </div>
      )}

      {!myRecord && !isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
          <div className="text-4xl mb-3 opacity-40">🔍</div>
          <p className="font-display text-[18px] text-muted-foreground">No NHS record found</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1.5">
            Your record may be under a different email. Contact your NHS advisor.
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-3">Searching for: {userEmail}</p>
        </div>
      )}

      {/* Admin: All Records */}
      {isAdmin && allRecords && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[20px] font-semibold text-foreground">All Student Records</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search students…"
                className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-[13px] outline-none focus:border-crimson transition-all w-56"
              />
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Students", val: allRecords.length, color: "text-foreground" },
              { label: "Complete", val: allRecords.filter((r) => r.status === "complete").length, color: "text-emerald-600" },
              { label: "On Track", val: allRecords.filter((r) => r.status === "on_track").length, color: "text-blue-600" },
              { label: "Behind", val: allRecords.filter((r) => r.status === "behind").length, color: "text-amber-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <p className={cn("font-display text-[32px] font-semibold leading-none tracking-tight", color)}>{val}</p>
                <p className="text-[11px] font-bold uppercase tracking-[.06em] text-muted-foreground mt-1.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Student", "Grade", "Hours", "Required", "Progress", "Status"].map((h) => (
                    <th key={h} className="text-left text-[10.5px] font-bold uppercase tracking-[.07em] text-muted-foreground px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAll.map((record, i) => {
                  const cfg = STATUS_CONFIG[record.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: i * 0.02, duration: 0.28 } }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13.5px] font-semibold text-foreground">{record.studentName}</p>
                        {record.studentEmail && <p className="text-[11px] text-muted-foreground">{record.studentEmail}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-muted-foreground">{record.grade ? `Grade ${record.grade}` : "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-display text-[17px] font-semibold text-foreground">{record.totalHours}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-muted-foreground">{record.requiredHours}</span>
                      </td>
                      <td className="px-5 py-3.5 w-40">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", cfg.bar)}
                            style={{ width: `${record.progressPct}%` }}
                          />
                        </div>
                        <p className="text-[10.5px] text-muted-foreground mt-1">{record.progressPct}%</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className={cn("inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full", cfg.bg, cfg.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredAll.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-[13.5px]">
                      No records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {allRecords.length > 0 && (
              <div className="px-5 py-3 border-t border-border text-[11.5px] text-muted-foreground">
                Last synced: {format(new Date(allRecords[0]?.lastSyncAt ?? new Date()), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MyNhsCard({ record }: { record: NhsRecord }) {
  const cfg = STATUS_CONFIG[record.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-7 py-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.09em] text-muted-foreground mb-1">Your NHS Progress</p>
            <p className="font-display text-[13px] text-muted-foreground">{record.studentName}</p>
          </div>
          <div className={cn("flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full", cfg.bg, cfg.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {cfg.label}
          </div>
        </div>

        {/* Big progress display */}
        <div className="mt-6">
          <div className="flex items-end gap-2 mb-3">
            <span className="font-display text-[56px] font-semibold leading-none tracking-tight text-foreground">
              {record.totalHours}
            </span>
            <span className="text-[18px] text-muted-foreground pb-2">/ {record.requiredHours} hrs</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${record.progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn("h-full rounded-full", cfg.bar)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-2">
            {record.status === "complete"
              ? `🎉 All ${record.requiredHours} hours completed!`
              : `${Math.max(0, record.requiredHours - record.totalHours)} hours remaining to complete NHS requirement`}
          </p>
        </div>
      </div>

      {/* Activities */}
      {record.activities.length > 0 && (
        <div className="px-7 py-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[.09em] text-muted-foreground mb-4">Activities</p>
          <div className="space-y-3">
            {record.activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-medium text-foreground">{a.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">{a.category}{a.date && ` · ${a.date}`}</p>
                </div>
                <span className="font-display text-[15px] font-semibold text-foreground">{a.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
