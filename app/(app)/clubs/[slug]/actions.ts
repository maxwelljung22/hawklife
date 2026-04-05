// app/(app)/clubs/[slug]/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessAdmin, canManageClubMembershipRole } from "@/lib/roles";
import type { ApplicationStatus, MembershipRole, ResourceCategory, ResourceType } from "@prisma/client";

async function canManageClub(clubId: string, userId: string, role: string) {
  if (canAccessAdmin(role as any)) return true;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId } },
    select: { role: true, status: true },
  });

  return Boolean(membership && membership.status === "ACTIVE" && canManageClubMembershipRole(membership.role));
}

function normalizeApplicationFields(fields: any[]) {
  const normalized: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }> = [];

  for (const [index, field] of fields.entries()) {
    const label = String(field?.label ?? "").trim();
    if (!label) continue;

    const type = String(field?.type ?? "text").trim();
    const required = Boolean(field?.required);
    const placeholder = String(field?.placeholder ?? "").trim();
    const rawOptions = Array.isArray(field?.options) ? field.options : [];
    const options = rawOptions.map((option: unknown) => String(option).trim()).filter(Boolean);

    normalized.push({
      id: String(field?.id ?? `field-${index + 1}`),
      label,
      type: ["text", "textarea", "email", "select"].includes(type) ? type : "text",
      required,
      placeholder: placeholder || undefined,
      options: type === "select" ? options : undefined,
    });
  }

  return normalized;
}

export async function createPost(clubId: string, title: string, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to post announcements" };
  }

  try {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true, slug: true },
    });
    if (!club) return { error: "Club not found" };

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
          title: `${club.name} announcement`,
          body: title,
          type: "club_post",
          refId: post.id,
          refType: "Post",
        })),
      });
    }

    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath(`/clubs`);
    revalidatePath("/dashboard");
    return { post };
  } catch (err) {
    console.error("[createPost]", err);
    return { error: "Failed to post announcement" };
  }
}

export async function updatePost(postId: string, title: string, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, clubId: true },
  });
  if (!post) return { error: "Announcement not found" };

  if (!(await canManageClub(post.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to edit announcements" };
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { title: title.trim(), content: content.trim() },
      include: { author: { select: { name: true, image: true } } },
    });
    revalidatePath("/clubs");
    return { post: updatedPost };
  } catch (err) {
    console.error("[updatePost]", err);
    return { error: "Failed to update announcement" };
  }
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, clubId: true },
  });
  if (!post) return { error: "Announcement not found" };

  if (!(await canManageClub(post.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to delete announcements" };
  }

  try {
    await prisma.post.delete({ where: { id: postId } });
    revalidatePath("/clubs");
    return { success: true };
  } catch (err) {
    console.error("[deletePost]", err);
    return { error: "Failed to delete announcement" };
  }
}

export async function createClubEvent(
  clubId: string,
  data: { title: string; description?: string; location?: string; startTime: string; endTime: string }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to create events" };
  }

  try {
    const event = await prisma.event.create({
      data: {
        clubId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/clubs");
    return { event };
  } catch (err) {
    console.error("[createClubEvent]", err);
    return { error: "Failed to create event" };
  }
}

export async function updateClubEvent(
  eventId: string,
  data: { title: string; description?: string; location?: string; startTime: string; endTime: string }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true },
  });
  if (!event?.clubId) return { error: "Event not found" };

  if (!(await canManageClub(event.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to edit events" };
  }

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });

    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/clubs");
    return { event: updatedEvent };
  } catch (err) {
    console.error("[updateClubEvent]", err);
    return { error: "Failed to update event" };
  }
}

export async function deleteClubEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true },
  });
  if (!event?.clubId) return { error: "Event not found" };

  if (!(await canManageClub(event.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to delete events" };
  }

  try {
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/clubs");
    return { success: true };
  } catch (err) {
    console.error("[deleteClubEvent]", err);
    return { error: "Failed to delete event" };
  }
}

export async function createClubResource(
  clubId: string,
  data: {
    name: string;
    url: string;
    description?: string;
    type?: ResourceType;
    category?: ResourceCategory;
    dueAt?: string | null;
    membersOnly?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to add resources" };
  }

  try {
    const resource = await prisma.resource.create({
      data: {
        clubId,
        uploaderId: session.user.id,
        name: data.name.trim(),
        url: data.url.trim(),
        description: data.description?.trim() || null,
        type: data.type ?? "LINK",
        category: data.category ?? "RESOURCE",
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        membersOnly: data.membersOnly ?? true,
      },
    });

    revalidatePath("/clubs");
    return { resource };
  } catch (err) {
    console.error("[createClubResource]", err);
    return { error: "Failed to add resource" };
  }
}

export async function updateClubResource(
  resourceId: string,
  data: {
    name: string;
    url: string;
    description?: string;
    type?: ResourceType;
    category?: ResourceCategory;
    dueAt?: string | null;
    membersOnly?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, clubId: true },
  });
  if (!resource) return { error: "Resource not found" };

  if (!(await canManageClub(resource.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to edit resources" };
  }

  try {
    const updatedResource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        name: data.name.trim(),
        url: data.url.trim(),
        description: data.description?.trim() || null,
        type: data.type ?? "LINK",
        category: data.category ?? "RESOURCE",
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        membersOnly: data.membersOnly ?? true,
      },
    });

    revalidatePath("/clubs");
    return { resource: updatedResource };
  } catch (err) {
    console.error("[updateClubResource]", err);
    return { error: "Failed to update resource" };
  }
}

export async function updateClubWorkspace(
  clubId: string,
  data: { workspaceTitle?: string; workspaceDescription?: string }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to edit the workspace" };
  }

  try {
    const club = await prisma.club.update({
      where: { id: clubId },
      data: {
        workspaceTitle: data.workspaceTitle?.trim() || null,
        workspaceDescription: data.workspaceDescription?.trim() || null,
      },
      select: {
        workspaceTitle: true,
        workspaceDescription: true,
        slug: true,
      },
    });

    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath("/clubs");
    return { club };
  } catch (err) {
    console.error("[updateClubWorkspace]", err);
    return { error: "Failed to update workspace" };
  }
}

export async function updateClubMemberRole(clubId: string, memberUserId: string, role: MembershipRole) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };
  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to manage members" };
  }

  try {
    await prisma.membership.update({
      where: { userId_clubId: { userId: memberUserId, clubId } },
      data: { role, status: "ACTIVE" },
    });
    revalidatePath("/clubs");
    return { success: true };
  } catch (err) {
    console.error("[updateClubMemberRole]", err);
    return { error: "Failed to update member role" };
  }
}

export async function removeClubMember(clubId: string, memberUserId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };
  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to manage members" };
  }

  if (memberUserId === session.user.id) {
    return { error: "Use Leave Club if you want to remove yourself." };
  }

  try {
    await prisma.membership.update({
      where: { userId_clubId: { userId: memberUserId, clubId } },
      data: { status: "INACTIVE", role: "MEMBER" },
    });
    revalidatePath("/clubs");
    return { success: true };
  } catch (err) {
    console.error("[removeClubMember]", err);
    return { error: "Failed to remove member" };
  }
}

export async function deleteClubResource(resourceId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, clubId: true },
  });
  if (!resource) return { error: "Resource not found" };

  if (!(await canManageClub(resource.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to delete resources" };
  }

  try {
    await prisma.resource.delete({ where: { id: resourceId } });
    revalidatePath("/clubs");
    return { success: true };
  } catch (err) {
    console.error("[deleteClubResource]", err);
    return { error: "Failed to delete resource" };
  }
}

export async function submitApplication(clubId: string, responses: Record<string, string>) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { requiresApp: true, slug: true },
  });
  if (!club?.requiresApp) return { error: "This club is not currently accepting applications" };

  const form = await prisma.appForm.findUnique({
    where: { clubId },
    select: { isOpen: true, deadline: true, fields: true },
  });
  if (!form?.isOpen) return { error: "Applications are closed" };
  if (form.deadline && new Date() > form.deadline) return { error: "Application deadline has passed" };

  const existing = await prisma.application.findUnique({
    where: { clubId_applicantId: { clubId, applicantId: session.user.id } },
  });
  if (existing) return { error: "You have already applied" };

  const fields = normalizeApplicationFields(Array.isArray(form.fields) ? (form.fields as any[]) : []);
  for (const field of fields) {
    if (!field.required) continue;
    const value = String(responses[field.id] ?? "").trim();
    if (!value) {
      return { error: `Please complete "${field.label}".` };
    }
  }

  try {
    await prisma.application.create({
      data: { clubId, applicantId: session.user.id, responses, status: "SUBMITTED" },
    });
    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath(`/applications`);
    revalidatePath(`/clubs`);
    return { success: true };
  } catch (err) {
    return { error: "Failed to submit application" };
  }
}

export async function saveClubApplicationForm(
  clubId: string,
  input: {
    enabled: boolean;
    isOpen: boolean;
    deadline?: string | null;
    maxSlots?: string | number | null;
    fields: any[];
  }
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  if (!(await canManageClub(clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to manage applications" };
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, slug: true },
  });
  if (!club) return { error: "Club not found" };

  const fields = normalizeApplicationFields(input.fields);
  if (input.enabled && fields.length === 0) {
    return { error: "Add at least one application question." };
  }

  try {
    await prisma.$transaction([
      prisma.club.update({
        where: { id: clubId },
        data: { requiresApp: input.enabled },
      }),
      prisma.appForm.upsert({
        where: { clubId },
        update: {
          isOpen: input.enabled ? input.isOpen : false,
          deadline: input.deadline ? new Date(input.deadline) : null,
          maxSlots: input.maxSlots ? Number(input.maxSlots) : null,
          fields,
        },
        create: {
          clubId,
          isOpen: input.enabled ? input.isOpen : false,
          deadline: input.deadline ? new Date(input.deadline) : null,
          maxSlots: input.maxSlots ? Number(input.maxSlots) : null,
          fields,
        },
      }),
    ]);

    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath(`/applications`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (err) {
    console.error("[saveClubApplicationForm]", err);
    return { error: "Failed to save application settings" };
  }
}

export async function reviewClubApplication(
  applicationId: string,
  status: ApplicationStatus,
  reviewNotes?: string
) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      clubId: true,
      applicantId: true,
      club: { select: { slug: true } },
    },
  });
  if (!application) return { error: "Application not found" };

  if (!(await canManageClub(application.clubId, session.user.id, session.user.role))) {
    return { error: "You must be a club leader to review applications" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: applicationId },
        data: {
          status,
          reviewNotes: reviewNotes?.trim() || null,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      });

      if (status === "ACCEPTED") {
        await tx.membership.upsert({
          where: { userId_clubId: { userId: application.applicantId, clubId: application.clubId } },
          update: { status: "ACTIVE" },
          create: {
            userId: application.applicantId,
            clubId: application.clubId,
            status: "ACTIVE",
            role: "MEMBER",
          },
        });
      }
    });

    revalidatePath(`/clubs/${application.club.slug}`);
    revalidatePath(`/applications`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (err) {
    console.error("[reviewClubApplication]", err);
    return { error: "Failed to review application" };
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
