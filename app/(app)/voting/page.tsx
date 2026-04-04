// app/(app)/voting/page.tsx
import { prisma } from "@/lib/prisma";
import { VotingClient } from "./voting-client";
import { canAccessAdmin, canAccessFacultyTools } from "@/lib/roles";
import { getSession } from "@/lib/session";

export const metadata = { title: "Polls & Elections" };
export const dynamic = "force-dynamic";

export default async function VotingPage() {
  const session = await getSession();
  if (!session?.user) return null;

  const [polls, userVotes] = await Promise.all([
    prisma.poll.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        club: { select: { name: true, emoji: true, slug: true } },
        options: {
          orderBy: { order: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.vote.findMany({
      where: { userId: session.user.id },
      select: { pollId: true, optionId: true },
    }),
  ]);

  const votesMap = Object.fromEntries(userVotes.map((v) => [v.pollId, v.optionId]));

  return (
    <VotingClient
      polls={polls as any}
      userVotes={votesMap}
      userId={session.user.id}
      isAdmin={canAccessAdmin(session.user.role)}
      canManagePolls={canAccessFacultyTools(session.user.role)}
    />
  );
}
