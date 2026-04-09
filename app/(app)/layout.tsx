import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FirstRunIntroGate } from "@/components/intro/first-run-intro-gate";
import { AppShell } from "@/components/layout/app-shell";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";
import { canParticipateInFlex } from "@/lib/flex-attendance";
import { remember } from "@/lib/server-cache";

const APP_SHELL_CACHE_TTL_MS = 10_000;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  let userState: { hasSeenIntro: boolean; graduationYear: number | null } | null = null;
  let notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    refId: string | null;
    refType: string | null;
    isRead: boolean;
    createdAt: Date;
  }> = [];
  let unreadNotifications = 0;

  try {
    ({ userState, notifications, unreadNotifications } = await remember(
      `app-shell:${session.user.id}`,
      APP_SHELL_CACHE_TTL_MS,
      async () => {
        const [resolvedUserState, resolvedNotifications, resolvedUnreadNotifications] = await Promise.all([
          prisma.user.findUnique({
            where: { id: session.user.id },
            select: { hasSeenIntro: true, graduationYear: true },
          }),
          prisma.notification.findMany({
            where: { userId: session.user.id },
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
          prisma.notification.count({
            where: { userId: session.user.id, isRead: false },
          }),
        ]);

        return {
          userState: resolvedUserState,
          notifications: resolvedNotifications,
          unreadNotifications: resolvedUnreadNotifications,
        };
      }
    ));
  } catch (error) {
    if (!isPrismaMissingColumnError(error)) {
      throw error;
    }

    notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
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
    });
    unreadNotifications = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
    userState = { hasSeenIntro: true, graduationYear: 2027 };
  }

  return (
    <FirstRunIntroGate
      userId={session.user.id}
      shouldShowInitially={!userState?.hasSeenIntro}
      shouldRequireAccountSetup={canParticipateInFlex({ role: session.user.role, graduationYear: userState?.graduationYear ?? null }) && !userState?.graduationYear}
    >
      <AppShell user={session.user} notifications={notifications} unreadNotifications={unreadNotifications}>
        {children}
      </AppShell>
    </FirstRunIntroGate>
  );
}
