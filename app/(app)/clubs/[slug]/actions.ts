// app/(app)/clubs/[slug]/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessAdmin } from "@/lib/roles";

export async function createPost(clubId: string, title: string, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  // Check user is a leader or admin
  const isAdmin = canAccessAdmin(session.user.role);
  if (!isAdmin) {
    const membership = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
      select: { role: true, status: true },
    });
    if (!membership || membership.status !== "ACTIVE" || !["PRESIDENT","OFFICER","FACULTY_ADVISOR"].includes(membership.role)) {
      return { error: "You must be a club leader to post announcements" };
    }
  }

  try {
    const post = await prisma.post.create({
      data: { clubId, authorId: session.user.id, title, content },
      include: { author: { select: { name: true, image: true } } },
    });

    // Create notifications for all active members
    const members = await prisma.membership.findMany({
      where: { clubId, status: "ACTIVE", NOT: { userId: session.user.id } },
      select: { userId: true },
    });
    if (members.length > 0) {
      await prisma.notification.createMany({
        data: members.map((m) => ({
          userId: m.userId,
          title: `New post in ${post.clubId}`,
          body: title,
          type: "club_post",
          refId: post.id,
          refType: "Post",
        })),
      });
    }

    revalidatePath(`/clubs`);
    return { post };
  } catch (err) {
    console.error("[createPost]", err);
    return { error: "Failed to post announcement" };
  }
}

export async function submitApplication(clubId: string, responses: Record<string, string>) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  // Check form is open
  const form = await prisma.appForm.findUnique({ where: { clubId }, select: { isOpen: true, deadline: true } });
  if (!form?.isOpen) return { error: "Applications are closed" };
  if (form.deadline && new Date() > form.deadline) return { error: "Application deadline has passed" };

  // Check not already applied
  const existing = await prisma.application.findUnique({
    where: { clubId_applicantId: { clubId, applicantId: session.user.id } },
  });
  if (existing) return { error: "You have already applied" };

  try {
    await prisma.application.create({
      data: { clubId, applicantId: session.user.id, responses, status: "SUBMITTED" },
    });
    revalidatePath(`/clubs`);
    return { success: true };
  } catch (err) {
    return { error: "Failed to submit application" };
  }
}

export async function castVote(pollId: string, optionId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { isActive: true, endsAt: true } });
  if (!poll?.isActive) return { error: "Poll is not active" };
  if (poll.endsAt && new Date() > poll.endsAt) return { error: "Poll has ended" };

  const existing = await prisma.vote.findUnique({
    where: { pollId_userId: { pollId, userId: session.user.id } },
  });
  if (existing) return { error: "You have already voted" };

  try {
    await prisma.vote.create({ data: { pollId, optionId, userId: session.user.id } });
    revalidatePath(`/clubs`);
    return { success: true };
  } catch (err) {
    return { error: "Failed to cast vote" };
  }
}
