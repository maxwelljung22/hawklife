import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="app-shell-bg flex min-h-screen bg-background">
      <Sidebar user={session.user} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[288px]">
        <Topbar user={session.user} />
        <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
