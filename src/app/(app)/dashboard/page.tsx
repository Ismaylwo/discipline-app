import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDushanbeDayBounds, addDaysIso } from "@/lib/date";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectGrid } from "@/components/projects/ProjectGrid";

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const { startIso, endIso } = getDushanbeDayBounds(new Date());
  const weekStartIso = addDaysIso(startIso, -6); // 7 days including today

  const [
    { data: todayTasks },
    { data: overdueTasks },
    { data: doneWeek },
    { data: activeProjects },
    projProgress
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,deadline,status", { count: "exact" })
      .gte("deadline", startIso)
      .lte("deadline", endIso)
      .neq("status", "done")
      .order("deadline", { ascending: true })
      .limit(6),
    supabase
      .from("tasks")
      .select("id,title,deadline,status", { count: "exact" })
      .lt("deadline", startIso)
      .neq("status", "done")
      .order("deadline", { ascending: true })
      .limit(6),
    supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .gte("completed_at", weekStartIso)
      .eq("status", "done"),
    supabase
      .from("projects")
      .select("id", { count: "exact" })
      .eq("status", "active"),
    supabase.rpc("stats_projects_progress")
  ]);

  const todayCount = (todayTasks as any)?.length ?? 0;
  const overdueCount = (overdueTasks as any)?.length ?? 0;
  const doneCount = (doneWeek as any)?.length ?? 0;
  const projectsCount = (activeProjects as any)?.length ?? 0;

  const topProjects = ((projProgress.data as any[]) ?? []).slice(0, 6);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Сегодня</CardTitle>
            <CardDescription>Задачи с дедлайном на сегодня</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{todayCount}</div>
            <Link className="text-sm text-zinc-600 hover:underline" href="/tasks?filter=today">
              открыть
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Просрочено</CardTitle>
            <CardDescription>Нужно закрыть</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{overdueCount}</div>
            <Link className="text-sm text-zinc-600 hover:underline" href="/tasks?filter=overdue">
              открыть
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сделано</CardTitle>
            <CardDescription>За последние 7 дней</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{doneCount}</div>
            <Link className="text-sm text-zinc-600 hover:underline" href="/stats">
              статистика
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Проекты</CardTitle>
            <CardDescription>Активные</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{projectsCount}</div>
            <Link className="text-sm text-zinc-600 hover:underline" href="/projects">
              открыть
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Сегодня (топ)</CardTitle>
            <CardDescription>Быстрый обзор</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(todayTasks ?? []).length ? (
              (todayTasks ?? []).map((t: any) => (
                <Link key={t.id} href="/tasks?filter=today" className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 hover:bg-zinc-50">
                  <div className="truncate">{t.title}</div>
                  <Badge variant="today">{(t.deadline ?? "").slice(0, 10)}</Badge>
                </Link>
              ))
            ) : (
              <div className="text-sm text-zinc-500">На сегодня задач нет 🎉</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Просрочено (топ)</CardTitle>
            <CardDescription>Чтобы закрыть долг</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {(overdueTasks ?? []).length ? (
              (overdueTasks ?? []).map((t: any) => (
                <Link key={t.id} href="/tasks?filter=overdue" className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 hover:bg-zinc-50">
                  <div className="truncate">{t.title}</div>
                  <Badge variant="overdue">{(t.deadline ?? "").slice(0, 10)}</Badge>
                </Link>
              ))
            ) : (
              <div className="text-sm text-zinc-500">Просроченных задач нет 👍</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Проекты</div>
          <Link className="text-sm text-zinc-600 hover:underline" href="/projects">
            все проекты →
          </Link>
        </div>
        {topProjects.length ? (
          <ProjectGrid items={topProjects} />
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-500">Пока нет проектов. Нажмите «Добавить» → Проект.</div>
        )}
      </div>
    </div>
  );
}
