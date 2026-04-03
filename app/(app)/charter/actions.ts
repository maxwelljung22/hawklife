"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ApplicationStatus, ClubCategory } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/roles";
import { normalizeRoleEntries, normalizeStringArray, type CharterFormValues } from "@/lib/charter";

const charterSchema = z.object({
  id: z.string().cuid().optional(),
  clubName: z.string().trim().min(3).max(80),
  category: z.custom<ClubCategory>(),
  missionStatement: z.string().trim().min(40).max(1200),
  founderName: z.string().trim().min(2).max(80),
  coFounders: z.array(z.string()).max(8),
  leadershipRoles: z.array(
    z.object({
      title: z.string(),
      person: z.string(),
    })
  ).max(8),
  whyExist: z.string().trim().min(80).max(1800),
  uniqueValue: z.string().trim().min(60).max(1800),
  plannedEvents: z.array(z.string()).max(8),
  meetingFrequency: z.string().trim().min(3).max(50),
  expectedMemberCount: z.string().trim(),
  advisorName: z.string().trim().max(80),
  advisorEmail: z.string().trim().max(120),
});

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You need to be signed in to continue.");
  }
  return session;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function submitCharterApplication(input: CharterFormValues) {
  try {
    const session = await requireUser();
    const parsed = charterSchema.parse(input);
    const expectedMemberCount = Number(parsed.expectedMemberCount);
    if (!Number.isFinite(expectedMemberCount) || expectedMemberCount < 5) {
      throw new Error("Expected member count needs to be at least 5.");
    }

    const coFounders = normalizeStringArray(parsed.coFounders);
    const leadershipRoles = normalizeRoleEntries(parsed.leadershipRoles);
    const plannedEvents = normalizeStringArray(parsed.plannedEvents);

    if (leadershipRoles.length < 2) {
      throw new Error("Add at least two clear leadership roles.");
    }

    if (plannedEvents.length < 2) {
      throw new Error("List at least two planned events.");
    }

    const payload = {
      clubName: parsed.clubName.trim(),
      category: parsed.category,
      missionStatement: parsed.missionStatement.trim(),
      founderName: parsed.founderName.trim(),
      coFounders,
      leadershipRoles,
      whyExist: parsed.whyExist.trim(),
      uniqueValue: parsed.uniqueValue.trim(),
      plannedEvents,
      meetingFrequency: parsed.meetingFrequency.trim(),
      expectedMemberCount,
      advisorName: parsed.advisorName.trim() || null,
      advisorEmail: parsed.advisorEmail.trim() || null,
      status: "SUBMITTED" as ApplicationStatus,
      submittedAt: new Date(),
      reviewNotes: null,
      reviewedAt: null,
      reviewedBy: null,
    };

    const application = parsed.id
      ? await prisma.charterApplication.update({
          where: { id: parsed.id, applicantId: session.user.id },
          data: payload,
        }).catch(async () =>
          prisma.charterApplication.create({
            data: { ...payload, applicantId: session.user.id },
          })
        )
      : await prisma.charterApplication.create({
          data: { ...payload, applicantId: session.user.id },
        });

    revalidatePath("/charter/apply");
    revalidatePath("/admin/charters");

    return { success: true, applicationId: application.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function reviewCharterApplication(input: {
  applicationId: string;
  status: ApplicationStatus;
  reviewNotes?: string;
}) {
  try {
    const session = await requireAdmin();
    await prisma.charterApplication.update({
      where: { id: input.applicationId },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes?.trim() || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    revalidatePath("/admin/charters");
    revalidatePath("/charter/apply");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update application." };
  }
}
