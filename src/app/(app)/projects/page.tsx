import { createSupabaseServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProjectGrid } from "@/components/projects/ProjectGrid";

export default async function ProjectsPage() {
  const supabase = await createSupabaseServer();

  const { data: items } = await supabase.rpc("stats_projects_progress");

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Проекты</CardTitle>
          <CardDescription>Прогресс считается по задачам в проекте.</CardDescription>
        </CardHeader>
        <CardContent>
          {(items ?? []).length ? (
            <ProjectGrid items={(items ?? []) as any} />
          ) : (
            <div className="text-sm text-zinc-500">Пока нет проектов. Нажмите «Добавить» → Проект.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
