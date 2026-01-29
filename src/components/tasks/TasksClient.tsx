"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FilterChips } from "@/components/common/FilterChips";
import { TaskList } from "./TaskList";
import { Task } from "./types";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

const chips = [
  { id: "all", label: "Все" },
  { id: "today", label: "Сегодня" },
  { id: "overdue", label: "Просрочено" },
  { id: "week", label: "Эта неделя" },
  { id: "done", label: "Выполнено" }
];

export function TasksClient({
  tasks,
  categories,
  projects,
  variant = "full",
  basePath = "/tasks"
}: {
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  variant?: "full" | "embedded";
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Only manipulate URL in full mode and only when we're on the basePath
  const canRoute = variant === "full" && pathname.startsWith(basePath);

  const filter = sp.get("filter") || "all";
  const q = sp.get("q") || "";
  const category = sp.get("category") || "all";
  const project = sp.get("project") || "all";
  const status = sp.get("status") || "all";

  const [qLocal, setQLocal] = useState(q);

  useEffect(() => setQLocal(q), [q]);

  const setParam = (key: string, value: string) => {
    if (!canRoute) return;
    const params = new URLSearchParams(sp.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.replace(`${basePath}?${params.toString()}`);
  };

  // Debounce search
  useEffect(() => {
    if (!canRoute) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (!qLocal.trim()) params.delete("q");
      else params.set("q", qLocal.trim());
      router.replace(`${basePath}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [qLocal]);

  const title = useMemo(() => {
    if (variant === "embedded") return "";
    const chip = chips.find((c) => c.id === filter)?.label ?? "Все";
    return `Задачи — ${chip}`;
  }, [variant, filter]);

  return (
    <div className="grid gap-4">
      {variant === "full" ? (
        <>
          <div className="grid gap-3 rounded-2xl border bg-white p-4">
            <div className="text-lg font-semibold">{title}</div>

            <FilterChips chips={chips} activeId={filter} onChange={(id) => setParam("filter", id === "all" ? "all" : id)} />

            <div className="grid gap-3 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label>Поиск</Label>
                <Input value={qLocal} onChange={(e) => setQLocal(e.target.value)} placeholder="Найти по названию/описанию…" />
              </div>

              <div>
                <Label>Категория</Label>
                <Select value={category} onValueChange={(v) => setParam("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Проект</Label>
                <Select value={project} onValueChange={(v) => setParam("project", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Статус</Label>
                <Select value={status} onValueChange={(v) => setParam("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="todo">todo</SelectItem>
                    <SelectItem value="doing">doing</SelectItem>
                    <SelectItem value="done">done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <TaskList
        tasks={tasks}
        categories={categories}
        projects={projects}
        emptyTitle={variant === "embedded" ? "Нет задач в проекте" : "Нет задач"}
        emptyDescription={variant === "embedded" ? "Добавьте задачи через кнопку Добавить (вверху)." : "Добавьте задачу и начните отмечать прогресс."}
      />
    </div>
  );
}
