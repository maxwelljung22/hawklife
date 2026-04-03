// app/(app)/profile/profile-client.tsx
"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Edit2, Save, X } from "lucide-react";
import { updateProfile } from "./actions";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getRoleBadgeClass, getRoleLabel } from "@/lib/roles";

export function ProfileClient({ user, memberships }: any) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: user.bio ?? "", grade: user.grade?.toString() ?? "" });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({ bio: form.bio, grade: form.grade ? parseInt(form.grade) : undefined });
      if (result?.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setEditing(false);
        toast({ title: "Profile updated ✓" });
      }
    });
  };

  return (
    <div className="space-y-7 max-w-2xl">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-7 shadow-card"
      >
        <div className="flex items-start gap-5">
          <Avatar className="h-16 w-16 ring-4 ring-background shadow-lg">
            <AvatarImage src={user.image} />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-gold to-crimson text-white font-display">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-[26px] font-semibold text-foreground">{user.name}</h1>
                <p className="text-[13.5px] text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-[.06em] px-2.5 py-1 rounded-full",
                    getRoleBadgeClass(user.role)
                  )}>
                    {getRoleLabel(user.role)}
                  </span>
                  {user.grade && (
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      Grade {user.grade}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground/50">
                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                  </span>
                </div>
              </div>

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-border rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="h-9 w-9 flex items-center justify-center border border-border rounded-xl hover:bg-muted transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1.5 px-3.5 py-2 bg-crimson text-white rounded-xl text-[13px] font-medium hover:bg-crimson/90 disabled:opacity-50 transition-all shadow-md shadow-crimson/20">
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mt-4">
              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Write a short bio…"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] resize-none outline-none focus:bg-card focus:border-border transition-all"
                  />
                  <select
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                    className="px-4 py-2.5 bg-muted border border-transparent rounded-xl text-[13.5px] outline-none focus:bg-card focus:border-border transition-all"
                  >
                    <option value="">Select grade</option>
                    {[9, 10, 11, 12].map((g) => <option key={g} value={g.toString()}>Grade {g}</option>)}
                  </select>
                </div>
              ) : (
                user.bio && <p className="text-[13.5px] text-foreground/75 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* My clubs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}>
        <h2 className="font-display text-[20px] font-semibold text-foreground mb-4">
          My Clubs
          <span className="ml-2 text-[14px] font-normal text-muted-foreground">({memberships.length})</span>
        </h2>
        {memberships.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="font-display text-[17px] text-muted-foreground">No clubs yet</p>
            <Link href="/clubs" className="inline-flex items-center mt-3 text-[13px] text-crimson font-medium hover:opacity-70 transition-opacity">
              Browse Directory →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberships.map((m: any, i: number) => (
              <Link key={m.id} href={`/clubs/${m.club.slug}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: i * 0.04 } }}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${m.club.gradientFrom}, ${m.club.gradientTo})` }}
                  >
                    {m.club.emoji}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">{m.club.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{m.role.toLowerCase().replace("_", " ")}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
