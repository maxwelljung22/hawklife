import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getNhsRecordForUser } from "@/lib/airtable";
import { DashboardClient } from "./dashboard-client";
import { getSession } from "@/lib/session";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const userId    = session.user.id;
  const userEmail = session.user.email;
  const userName  = session.user.name ?? null;

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
      where: { startTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
      take: 8,
      include: { club: { select: { name: true, emoji: true, slug: true } } },
    }),
    prisma.post.findMany({
      where: { club: { memberships: { some: { userId, status: "ACTIVE" } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        club:   { select: { name: true, emoji: true, slug: true } },
        author: { select: { name: true, image: true } },
      },
    }),
    prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        club: {
          select: {
            id: true, name: true, emoji: true, slug: true,
            category: true, gradientFrom: true, gradientTo: true,
            meetingDay: true, meetingTime: true,
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
      include: {
        club: { select: { name: true, slug: true } },
        assignee: { select: { name: true, image: true } },
      },
    }),
    prisma.workspaceAssignment.findMany({
      where: {
        club: { memberships: { some: { userId, status: "ACTIVE" } } },
        dueAt: { not: null, gte: new Date() },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: {
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
        deadline: { not: null, gte: new Date() },
      },
      orderBy: { deadline: "asc" },
      take: 8,
      include: {
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
      include: {
        club: { select: { name: true, slug: true } },
      },
    }),
    prisma.resource.findMany({
      where: {
        club: { memberships: { some: { userId, status: "ACTIVE" } } },
        OR: [
          { dueAt: { not: null, gte: new Date() } },
          { category: "FORM" },
        ],
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        club: { select: { name: true, slug: true } },
      },
    }),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-2xl" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-28 bg-muted rounded-2xl" />)}</div></div>}>
      <DashboardClient
        user={session.user}
        membershipCount={membershipCount}
        upcomingEvents={upcomingEvents as any}
        recentPosts={recentPosts as any}
        myMemberships={myMemberships as any}
        nhsRecord={nhsRecord}
        unreadNotifs={unreadNotifs}
        notifications={notifications as any}
        workspaceTasks={workspaceTasks as any}
        assignmentDeadlines={
          assignmentDeadlines.filter((assignment) => {
            const submission = assignment.submissions[0];
            return !submission || (!submission.submittedAt && !submission.completedAt);
          }) as any
        }
        applicationDeadlines={applicationDeadlines as any}
        pinnedPosts={pinnedPosts as any}
        importantResources={importantResources as any}
      />
    </Suspense>
  );
}
