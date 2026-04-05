import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Rocket, ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, canManageClubMembershipRole } from "@/lib/roles";
import { ClubWorkspaceClient } from "@/components/workspace/club-workspace-client";
import { AttendanceSetupNotice } from "@/components/attendance/attendance-setup-notice";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { isV4Enabled } from "@/lib/feature-flags";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Club Workspace",
};

async function getBaseClub(identifier: string) {
  try {
    return await prisma.club.findFirst({
      where: {
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        emoji: true,
        bannerUrl: true,
        gradientFrom: true,
        gradientTo: true,
        workspaceTitle: true,
        workspaceDescription: true,
      },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) throw error;

    return prisma.club
      .findFirst({
        where: {
          isActive: true,
          OR: [{ id: identifier }, { slug: identifier }],
        },
        select: {
          id: true,
          slug: true,
          name: true,
          emoji: true,
          bannerUrl: true,
          gradientFrom: true,
          gradientTo: true,
        },
      })
      .then((club) => (club ? { ...club, workspaceTitle: null, workspaceDescription: null } : null));
  }
}

async function getWorkspaceData(identifier: string, userId: string, userRole: string) {
  const club = await getBaseClub(identifier);
  if (!club) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId, clubId: club.id } },
    select: {
      status: true,
      role: true,
    },
  });

  const joined = membership?.status === "ACTIVE" || canAccessAdmin(userRole as UserRole);
  if (!joined) return { accessDenied: true as const, clubId: club.id };

  const [members, resources, streamPosts, assignments, tasks] = await Promise.all([
    prisma.membership
      .findMany({
        where: { clubId: club.id, status: "ACTIVE" },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.resource
      .findMany({
        where: { clubId: club.id, membersOnly: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          url: true,
          type: true,
          category: true,
          createdAt: true,
        },
      })
      .catch(async (error) => {
        if (!isPrismaSchemaMismatchError(error)) throw error;

        return prisma.resource
          .findMany({
            where: { clubId: club.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              description: true,
              url: true,
              type: true,
              createdAt: true,
            },
          })
          .then((items) =>
            items.map((item) => ({
              ...item,
              category: "RESOURCE",
            }))
          );
      }),
    prisma.workspacePost
      .findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, image: true } } },
          },
          reactions: { select: { id: true, userId: true } },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.workspaceAssignment
      .findMany({
        where: { clubId: club.id },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          submissions: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
    prisma.workspaceTask
      .findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return [];
        throw error;
      }),
  ]);

  return {
    club,
    currentUserId: userId,
    isLeader: canManageClubMembershipRole(membership?.role) || canAccessAdmin(userRole as UserRole),
    streamPosts,
    assignments,
    tasks,
    resources,
    members,
  };
}

function WorkspaceLocked({ slug }: { slug: string }) {
  return (
    <div className="mx-auto flex min-h-[72vh] w-full max-w-4xl items-center justify-center py-10 sm:py-16">
      <div className="w-full overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_right,rgba(139,26,26,0.10),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))/0.10] text-[hsl(var(--primary))]">
            <Rocket className="h-5 w-5" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Club Workspace</p>
          <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.06em] text-foreground" style={{ fontFamily: "Inter, var(--font-body)" }}>
            Coming soon in v4.0.0
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            We&apos;re locking the workspace while we finish the next release. Stream, assignments, tasks, resources, and member tools will return in a more polished v4.0.0 rollout.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="rounded-[1.5rem] border border-border/80 bg-background/70 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
            <p className="mt-3 text-[1.05rem] font-semibold text-foreground">Workspace access is temporarily locked.</p>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              You can still browse clubs and club pages normally while we finish the next version.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/clubs/${slug}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to club
            </Link>
            <Link
              href="/clubs"
              className="inline-flex items-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            >
              Back to directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ClubWorkspacePage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  const { slug } = await params;

  if (!isV4Enabled()) {
    return <WorkspaceLocked slug={slug} />;
  }

  try {
    const data = await getWorkspaceData(slug, session.user.id, session.user.role);
    if (!data) notFound();
    if ("accessDenied" in data) redirect(`/clubs/${data.clubId}`);

    return <ClubWorkspaceClient {...data} />;
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return (
        <AttendanceSetupNotice
          title="Workspace needs the latest database update"
          description="This deployment includes the new club workspace, but the database is still missing the workspace tables or fields. Apply the latest Prisma changes, then refresh this page."
          eyebrow="Club Workspace"
          migrationHint="Apply the club workspace migration, then redeploy or refresh the page. The checked-in file is `prisma/migrations/20260404190000_add_club_workspace_core/migration.sql`."
        />
      );
    }

    throw error;
  }
}
