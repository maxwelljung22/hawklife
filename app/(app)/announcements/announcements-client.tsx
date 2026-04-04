// app/(app)/announcements/announcements-client.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Pin, Trash2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeAnnouncement } from "./actions";

interface Post {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  club: { name: string; emoji: string; slug: string; gradientFrom: string; gradientTo: string };
  author: { name: string | null; image: string | null };
}

interface Props {
  posts: Post[];
  joinedClubIds: string[];
  userId: string;
  isAdmin: boolean;
  canModerate: boolean;
}

export function AnnouncementsClient({ posts, joinedClubIds, canModerate }: Props) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [items, setItems] = useState(posts);

  const displayed = filter === "all" ? items : items.filter((p) => joinedClubIds.length === 0 || joinedClubIds.some(() => true));

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleDelete = async (id: string) => {
    const result = await removeAnnouncement(id);
    if (!result?.error) {
      setItems((current) => current.filter((post) => post.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">News & Updates</p>
        <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
          <span className="italic">Announcements</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Updates from all clubs and school organizations.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "mine"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all",
              filter === f ? "bg-crimson border-crimson text-white shadow-md shadow-crimson/20" : "bg-card border-border text-muted-foreground hover:border-crimson/40"
            )}
          >
            {f === "all" ? "All Clubs" : "My Clubs"}
          </button>
        ))}
      </div>

      {/* Feed */}
      {displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl opacity-20 mb-4">📣</div>
          <p className="font-display text-[18px] text-muted-foreground">No announcements yet</p>
          <p className="text-[13px] text-muted-foreground/60 mt-1.5">
            {filter === "mine" ? "Join clubs to see their announcements." : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((post, i) => {
            const isExpanded = expanded.has(post.id);
            const isLong = post.content.length > 200;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }}
                className="bg-card border border-border rounded-2xl shadow-card overflow-hidden"
              >
                {post.isPinned && (
                  <div className="px-5 pt-3 pb-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.06em] text-amber-600">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </div>
                )}
                <div className="px-5 py-4">
                  {/* Club + author row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <Link href={`/clubs/${post.club.slug}`} className="flex items-center gap-2 group">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${post.club.gradientFrom}, ${post.club.gradientTo})` }}
                      >
                        {post.club.emoji}
                      </div>
                      <span className="text-[12.5px] font-semibold text-foreground/80 group-hover:text-crimson transition-colors">
                        {post.club.name}
                      </span>
                    </Link>
                    <span className="text-muted-foreground/40 text-[12px]">·</span>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.author.image ?? undefined} />
                        <AvatarFallback className="text-[8px] bg-muted">
                          {post.author.name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[12px] text-muted-foreground">{post.author.name}</span>
                    </div>
                    <span className="ml-auto text-[11.5px] text-muted-foreground/60">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                    {canModerate ? (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        aria-label="Remove announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  <h3 className="text-[15px] font-bold text-foreground mb-1.5">{post.title}</h3>
                  <p className={cn("text-[13.5px] text-foreground/72 leading-relaxed", !isExpanded && isLong && "line-clamp-3")}>
                    {post.content}
                  </p>
                  {isLong && (
                    <button onClick={() => toggleExpand(post.id)} className="text-[12.5px] text-crimson font-medium mt-1.5 hover:opacity-70 transition-opacity">
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
