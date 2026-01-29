import { createSupabaseServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatsCards } from "@/components/stats/StatsCards";
import { TasksDoneChart } from "@/components/stats/TasksDoneChart";
import { TasksByCategoryChart } from "@/components/stats/TasksByCategoryChart";

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function StatsPage() {
  const supabase = await createSupabaseServer();

  const end = new Date();
  const start = new Date(Date.now() - 29 * 24 * 60 * 60_000);
  const start_date = dateStr(start);
  const end_date = dateStr(end);

  // RPCs from supabase/stats.sql (optional but recommended)
  const [summaryRes, perDayRes, byCatRes, habitsRes, projRes] = await Promise.all([
    supabase.rpc("stats_tasks_summary", { start_date, end_date }),
    supabase.rpc("stats_tasks_done_per_day", { start_date, end_date }),
    supabase.rpc("stats_tasks_by_category", { start_date, end_date }),
    supabase.rpc("stats_habits_adherence", { start_date, end_date }),
    supabase.rpc("stats_projects_progress")
  ]);

  const summary = (summaryRes.data?.[0] as any) ?? null;
  const perDay = ((perDayRes.data as any[]) ?? []).map((x) => ({ day: x.day, done_count: Number(x.done_count) }));
  const byCat = ((byCatRes.data as any[]) ?? []).map((x) => ({
    category_name: x.category_name ?? "Без категории",
    total: Number(x.total),
    done: Number(x.done)
  }));
  const habits = (habitsRes.data as any[]) ?? [];
  const projects = (projRes.data as any[]) ?? [];

  return (
    <div className="grid gap-4">
      <StatsCards summary={summary} />

      <Tabs defaultValue="tasks">
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1">
            Задачи
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex-1">
            Привычки
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex-1">
            Проекты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Сделано по дням</CardTitle>
              <CardDescription>Последние 30 дней</CardDescription>
            </CardHeader>
            <CardContent>
              {perDay.length ? (
                <TasksDoneChart data={perDay} />
              ) : (
                <div className="text-sm text-zinc-500">Нет данных. Выполните supabase/stats.sql и начните отмечать задачи как done.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>По категориям</CardTitle>
              <CardDescription>Сколько создано и сколько сделано</CardDescription>
            </CardHeader>
            <CardContent>
              {byCat.length ? (
                <TasksByCategoryChart data={byCat} />
              ) : (
                <div className="text-sm text-zinc-500">Нет данных или нет категорий.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Adherence</CardTitle>
              <CardDescription>Доля дней с отметкой (последние 30 дней)</CardDescription>
            </CardHeader>
            <CardContent>
              {habits.length ? (
                <div className="grid gap-2">
                  {habits.map((h) => (
                    <div key={h.habit_id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm">
                      <div className="font-medium">{h.title}</div>
                      <div className="text-zinc-600">{Number(h.adherence).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Нет данных. Выполните supabase/stats.sql.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс проектов</CardTitle>
              <CardDescription>Активные проекты</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length ? (
                <div className="grid gap-2">
                  {projects.slice(0, 12).map((p) => (
                    <div key={p.project_id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="text-xs text-zinc-500">{p.deadline ? `дедлайн: ${p.deadline}` : "без дедлайна"}</div>
                      </div>
                      <div className="text-zinc-600">{Number(p.progress).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Нет данных. Выполните supabase/stats.sql.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
