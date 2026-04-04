// app/(app)/voting/voting-client.tsx
"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Trophy, Clock, Vote, CheckCircle, PlusCircle, WandSparkles } from "lucide-react";
import { castVoteAction, createPollAction } from "./actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PollOption {
  id: string;
  text: string;
  order: number;
  _count: { votes: number };
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  isActive: boolean;
  endsAt: string | null;
  _count: { votes: number };
  options: PollOption[];
  club: { name: string; emoji: string; slug: string } | null;
}

interface Props {
  polls: Poll[];
  userVotes: Record<string, string>; // pollId → optionId
  userId: string;
  isAdmin: boolean;
  canManagePolls: boolean;
}

export function VotingClient({ polls: initial, userVotes: initialVotes, userId, isAdmin, canManagePolls }: Props) {
  const [polls, setPolls] = useState(initial);
  const [myVotes, setMyVotes] = useState(initialVotes);
  const [pending, startTransition] = useTransition();
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    visibility: "ANONYMOUS" as "PUBLIC" | "ANONYMOUS",
    options: ["", ""],
    endsAt: "",
  });
  const { toast } = useToast();

  const handleVote = (pollId: string, optionId: string) => {
    if (myVotes[pollId] || pending) return;

    // Optimistic update
    setMyVotes((v) => ({ ...v, [pollId]: optionId }));
    setPolls((ps) =>
      ps.map((p) =>
        p.id !== pollId ? p : {
          ...p,
          _count: { votes: p._count.votes + 1 },
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, _count: { votes: o._count.votes + 1 } } : o
          ),
        }
      )
    );

    startTransition(async () => {
      const result = await castVoteAction(pollId, optionId);
      if (result?.error) {
        // Roll back
        setMyVotes((v) => { const n = { ...v }; delete n[pollId]; return n; });
        setPolls(initial);
        toast({ title: "Vote failed", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Vote recorded ✓", description: polls.find((p) => p.id === pollId)?.visibility === "ANONYMOUS" ? "Anonymous · Results shown when poll closes" : undefined });
      }
    });
  };

  const active   = polls.filter((p) => p.isActive);
  const closed   = polls.filter((p) => !p.isActive);

  const handleCreatePoll = () => {
    startTransition(async () => {
      const result = await createPollAction(createForm);
      if ("error" in result) {
        toast({ title: "Couldn't create poll", description: result.error, variant: "destructive" });
        return;
      }
      if (!("poll" in result)) {
        toast({ title: "Couldn't create poll", description: "Poll response was incomplete.", variant: "destructive" });
        return;
      }

      setPolls((current) => [result.poll as any, ...current]);
      setCreateForm({
        title: "",
        description: "",
        visibility: "ANONYMOUS",
        options: ["", ""],
        endsAt: "",
      });
      toast({ title: "Poll created", description: `${result.poll.title} is now live.` });
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-[10.5px] font-bold tracking-[.10em] uppercase text-crimson mb-2">Student Voice</p>
        <h1 className="font-display text-[34px] font-semibold text-foreground tracking-tight">
          Polls &amp; <span className="italic">Elections</span>
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          {active.length > 0 ? `${active.length} active poll${active.length !== 1 ? "s" : ""} — your vote is anonymous` : "No active polls right now"}
        </p>
      </div>

      {canManagePolls ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
          className="surface-card rounded-[30px] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[.10em] text-crimson">Create poll</p>
              <h2 className="mt-2 font-display text-[22px] font-semibold text-foreground">Launch a new vote</h2>
              <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-muted-foreground">
                Create quick pulse checks, school-wide polls, or election questions without leaving HawkLife.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
              <WandSparkles className="h-3.5 w-3.5 text-crimson" />
              Fast publish
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <Input
              value={createForm.title}
              onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Poll title"
            />
            <Textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short description"
              className="min-h-[110px]"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={createForm.visibility}
                onChange={(event) => setCreateForm((current) => ({ ...current, visibility: event.target.value as "PUBLIC" | "ANONYMOUS" }))}
                className="flex h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 shadow-[0_1px_0_rgba(17,24,39,0.02)] transition-all duration-200 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:ring-white/10"
              >
                <option value="ANONYMOUS">Anonymous</option>
                <option value="PUBLIC">Public</option>
              </select>
              <Input
                type="datetime-local"
                value={createForm.endsAt}
                onChange={(event) => setCreateForm((current) => ({ ...current, endsAt: event.target.value }))}
              />
            </div>

            <div className="grid gap-3">
              {createForm.options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      options: current.options.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                    }))
                  }
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setCreateForm((current) => ({ ...current, options: [...current.options, ""] }))}
                  disabled={createForm.options.length >= 6}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add option
                </Button>
                <Button onClick={handleCreatePoll} disabled={pending}>
                  Publish poll
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Active polls */}
      {active.length > 0 && (
        <div className="space-y-5">
          <h2 className="font-display text-[19px] font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </h2>
          {active.map((poll, i) => (
            <PollCard
              key={poll.id}
              poll={poll}
              myVoteOptionId={myVotes[poll.id]}
              onVote={(optId) => handleVote(poll.id, optId)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Closed polls */}
      {closed.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-[19px] font-semibold text-foreground text-muted-foreground/70">Closed</h2>
          {closed.map((poll, i) => (
            <PollCard
              key={poll.id}
              poll={poll}
              myVoteOptionId={myVotes[poll.id]}
              onVote={() => {}}
              index={i}
              closed
            />
          ))}
        </div>
      )}

      {polls.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl opacity-20 mb-4">🗳️</div>
          <p className="font-display text-[18px] text-muted-foreground">No polls yet</p>
        </div>
      )}
    </div>
  );
}

function PollCard({
  poll, myVoteOptionId, onVote, index, closed = false,
}: {
  poll: Poll;
  myVoteOptionId: string | undefined;
  onVote: (optId: string) => void;
  index: number;
  closed?: boolean;
}) {
  const hasVoted = !!myVoteOptionId;
  const showResults = hasVoted || closed;
  const totalVotes = poll._count.votes;
  const maxVotes = Math.max(...poll.options.map((o) => o._count.votes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06, duration: 0.35 } }}
      className="bg-card border border-border rounded-2xl shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[18px] font-semibold text-foreground">{poll.title}</h3>
            {poll.description && (
              <p className="text-[13px] text-muted-foreground mt-1">{poll.description}</p>
            )}
          </div>
          <span className={cn(
            "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5",
            closed ? "bg-muted text-muted-foreground" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", closed ? "bg-muted-foreground" : "bg-emerald-500")} />
            {closed ? "Closed" : "Active"}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2.5 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1"><Vote className="h-3 w-3" /> {totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
          {poll.club && (
            <Link href={`/clubs/${poll.club.slug}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              {poll.club.emoji} {poll.club.name}
            </Link>
          )}
          {poll.endsAt && !closed && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Ends {format(new Date(poll.endsAt), "MMM d")}
            </span>
          )}
          <span>{poll.visibility === "ANONYMOUS" ? "🔒 Anonymous" : "👁 Public"}</span>
        </div>
      </div>

      {/* Options */}
      <div className="px-6 py-4 space-y-2.5">
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0;
          const isMyVote = opt.id === myVoteOptionId;
          const isWinner = closed && opt._count.votes === maxVotes && totalVotes > 0;

          return (
            <motion.button
              key={opt.id}
              onClick={() => !closed && !hasVoted && onVote(opt.id)}
              disabled={closed || hasVoted}
              className={cn(
                "relative w-full text-left p-3.5 rounded-xl border overflow-hidden transition-all duration-150",
                !showResults && !closed && "hover:border-crimson cursor-pointer hover:shadow-glow-crimson",
                isMyVote && "border-crimson",
                isWinner && !isMyVote && "border-gold",
                !isMyVote && !isWinner && "border-border",
                (closed || hasVoted) && "cursor-default"
              )}
              whileTap={!closed && !hasVoted ? { scale: 0.99 } : undefined}
            >
              {/* Progress bar */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-xl",
                    isMyVote ? "bg-crimson/8" : isWinner ? "bg-gold/8" : "bg-muted/40"
                  )}
                />
              )}

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {isWinner && !showResults && <Trophy className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                  {isMyVote && <CheckCircle className="h-3.5 w-3.5 text-crimson flex-shrink-0" />}
                  {!isMyVote && showResults && isWinner && <Trophy className="h-3.5 w-3.5 text-gold flex-shrink-0" />}
                  {!isMyVote && showResults && !isWinner && <span className="w-3.5" />}
                  <span className={cn(
                    "text-[13.5px] font-[500]",
                    isMyVote ? "text-crimson" : isWinner ? "text-gold" : "text-foreground"
                  )}>
                    {opt.text}
                  </span>
                </div>
                {showResults && (
                  <span className={cn(
                    "text-[13px] font-bold flex-shrink-0",
                    isMyVote ? "text-crimson" : isWinner ? "text-gold" : "text-muted-foreground"
                  )}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}

        {!hasVoted && !closed && (
          <p className="text-[11.5px] text-muted-foreground/60 text-center pt-1">
            {poll.visibility === "ANONYMOUS" ? "Your vote is completely anonymous" : "Your vote will be recorded with your name"}
          </p>
        )}
      </div>
    </motion.div>
  );
}
