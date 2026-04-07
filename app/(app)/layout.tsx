import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FirstRunIntroGate } from "@/components/intro/first-run-intro-gate";
import { AppShell } from "@/components/layout/app-shell";
import { isPrismaMissingColumnError } from "@/lib/prisma-errors";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");
  let introState: { hasSeenIntro: boolean } | null = null;
  let accountSetupState: { graduationYear: number | null } | null = null;
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
    [introState, accountSetupState, notifications, unreadNotifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hasSeenIntro: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { graduationYear: true },
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
    introState = { hasSeenIntro: true };
    accountSetupState = { graduationYear: 2027 };
  }

  return (
    <FirstRunIntroGate
      userId={session.user.id}
      shouldShowInitially={!introState?.hasSeenIntro}
      shouldRequireAccountSetup={!accountSetupState?.graduationYear}
    >
      <AppShell user={session.user} notifications={notifications} unreadNotifications={unreadNotifications}>
        {children}
      </AppShell>
    </FirstRunIntroGate>
  );
}
