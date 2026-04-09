import { prisma } from "@/lib/prisma";
import { getNhsRecordForUser } from "@/lib/airtable";
import { remember } from "@/lib/server-cache";

const DASHBOARD_CACHE_TTL_MS = 15_000;

export async function getDashboardDataForUser(params: {
  userId: string;
  userEmail: string;
  userName: string | null;
}) {
  const { userId, userEmail, userName } = params;
  return remember(`dashboard:${userId}`, DASHBOARD_CACHE_TTL_MS, async () => {
    const now = new Date();
    const [
      membershipCount,
      upcomingEvents,
      recentPosts,
      myMemberships,
      nhsRecord,
      unreadNotifs,
      notifications,
      workspaceTasks,
      assignmentDeadlines,
      applicationDeadlines,
      pinnedPosts,
      importantResources,
    ] = await Promise.all([
      prisma.membership.count({ where: { userId, status: "ACTIVE" } }),
      prisma.event.findMany({
        where: { startTime: { gte: now }, isPublic: true },
        orderBy: { startTime: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          startTime: true,
          club: { select: { name: true, emoji: true, slug: true } },
        },
      }),
      prisma.post.findMany({
        where: { club: { memberships: { some: { userId, status: "ACTIVE" } } } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          club: { select: { name: true, emoji: true, slug: true } },
          author: { select: { name: true, image: true } },
        },
      }),
      prisma.membership.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          id: true,
          club: {
            select: {
              id: true,
              name: true,
              emoji: true,
              slug: true,
              category: true,
              gradientFrom: true,
              gradientTo: true,
              meetingDay: true,
              meetingTime: true,
            },
          },
        },
      }),
      getNhsRecordForUser(userEmail, userName),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          body: true,
          type: true,
          refId: true,
          refType: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.workspaceTask.findMany({
        where: {
          OR: [
            { assigneeId: userId },
            { club: { memberships: { some: { userId, status: "ACTIVE" } } } },
          ],
          status: { not: "COMPLETED" },
        },
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          updatedAt: true,
          club: { select: { name: true, slug: true } },
          assignee: { select: { name: true, image: true } },
        },
      }),
      prisma.workspaceAssignment.findMany({
        where: {
          club: { memberships: { some: { userId, status: "ACTIVE" } } },
          dueAt: { not: null, gte: now },
        },
        orderBy: { dueAt: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          dueAt: true,
          club: { select: { name: true, slug: true } },
          submissions: {
            where: { userId },
            select: { submittedAt: true, completedAt: true },
          },
        },
      }),
      prisma.appForm.findMany({
        where: {
          isOpen: true,
          deadline: { not: null, gte: now },
        },
        orderBy: { deadline: "asc" },
        take: 8,
        select: {
          id: true,
          deadline: true,
          maxSlots: true,
          club: { select: { name: true, slug: true } },
        },
      }),
      prisma.post.findMany({
        where: {
          isPinned: true,
          club: { memberships: { some: { userId, status: "ACTIVE" } } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          createdAt: true,
          club: { select: { name: true, slug: true } },
        },
      }),
      prisma.resource.findMany({
        where: {
          club: { memberships: { some: { userId, status: "ACTIVE" } } },
          OR: [{ dueAt: { not: null, gte: now } }, { category: "FORM" }],
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          name: true,
          category: true,
          dueAt: true,
          createdAt: true,
          club: { select: { name: true, slug: true } },
        },
      }),
    ]);

    return {
      membershipCount,
      upcomingEvents,
      recentPosts,
      myMemberships,
      nhsRecord,
      unreadNotifs,
      notifications,
      workspaceTasks,
      assignmentDeadlines: assignmentDeadlines.filter((assignment) => {
        const submission = assignment.submissions[0];
        return !submission || (!submission.submittedAt && !submission.completedAt);
      }),
      applicationDeadlines,
      pinnedPosts,
      importantResources,
    };
  });
}
