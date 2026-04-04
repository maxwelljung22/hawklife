// app/(app)/voting/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessFacultyTools } from "@/lib/roles";

type CreatePollInput = {
  title: string;
  description?: string;
  visibility: "PUBLIC" | "ANONYMOUS";
  options: string[];
  endsAt?: string;
};

export async function createPollAction(input: CreatePollInput) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };
  if (!canAccessFacultyTools(session.user.role)) {
    return { error: "Only faculty and admins can create polls." };
  }

  const title = input.title.trim().replace(/\s+/g, " ");
  const options = input.options.map((option) => option.trim()).filter(Boolean);
  const uniqueOptions = Array.from(new Set(options));

  if (!title) return { error: "Add a poll title." };
  if (uniqueOptions.length < 2) return { error: "Add at least two poll options." };

  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { error: "Enter a valid end date." };
  }

  try {
    const poll = await prisma.poll.create({
      data: {
        title,
        description: input.description?.trim() || null,
        visibility: input.visibility,
        endsAt,
        isActive: true,
        createdById: session.user.id,
        options: {
          create: uniqueOptions.map((text, index) => ({
            text,
            order: index,
          })),
        },
      },
      include: {
        club: { select: { name: true, emoji: true, slug: true } },
        options: {
          orderBy: { order: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        _count: { select: { votes: true } },
      },
    });

    revalidatePath("/voting");
    return { success: true, poll };
  } catch (err) {
    console.error("[createPoll]", err);
    return { error: "Failed to create poll." };
  }
}

export async function castVoteAction(pollId: string, optionId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  // Verify poll + option exist and poll is active
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { isActive: true, endsAt: true, options: { select: { id: true } } },
  });

  if (!poll) return { error: "Poll not found" };
  if (!poll.isActive) return { error: "This poll is no longer active" };
  if (poll.endsAt && new Date() > new Date(poll.endsAt)) return { error: "This poll has ended" };
  if (!poll.options.some((o) => o.id === optionId)) return { error: "Invalid option" };

  // Check for existing vote
  const existing = await prisma.vote.findUnique({
    where: { pollId_userId: { pollId, userId: session.user.id } },
  });
  if (existing) return { error: "You have already voted in this poll" };

  try {
    await prisma.vote.create({
      data: { pollId, optionId, userId: session.user.id },
    });
    revalidatePath("/voting");
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") return { error: "You have already voted" };
    console.error("[castVote]", err);
    return { error: "Failed to record your vote" };
  }
}
