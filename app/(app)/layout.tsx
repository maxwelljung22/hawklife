import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col ml-[288px] min-w-0">
        <Topbar user={session.user} />
        <main className="flex-1 p-6 lg:p-8 max-w-[1480px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
