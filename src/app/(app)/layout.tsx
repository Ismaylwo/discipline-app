import { createSupabaseServer } from "@/lib/supabase/server";
import { UIProvider } from "@/components/layout/ui-store";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabbar } from "@/components/layout/MobileTabbar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { PageTransitionShell } from "@/components/layout/PageTransitionShell";
import { SonnerToaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const [{ data: categories }, { data: projects }] = await Promise.all([
    supabase.from("categories").select("id,name,color").order("created_at", { ascending: true }),
    supabase.from("projects").select("id,title").eq("status", "active").order("created_at", { ascending: false })
  ]);

  return (
    <UIProvider>
      <div className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar categories={(categories ?? []) as any} projects={(projects ?? []) as any} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-10">
              <PageTransitionShell>{children}</PageTransitionShell>
            </main>
          </div>
        </div>
        <MobileTabbar />
        <CommandMenu />
        <SonnerToaster />
      </div>
    </UIProvider>
  );
}
