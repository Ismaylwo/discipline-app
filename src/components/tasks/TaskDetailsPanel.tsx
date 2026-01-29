"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getTaskDetailsAction, updateTaskAction } from "@/app/(app)/actions";
import { SubtaskList } from "./SubtaskList";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

function toDateInput(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function fromDateInput(v: string) {
  return v ? new Date(`${v}T12:00:00+05:00`).toISOString() : null;
}

export function TaskDetailsPanel({
  open,
  taskId,
  onOpenChange,
  categories,
  projects
}: {
  open: boolean;
  taskId: string | null;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  projects: Project[];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [local, setLocal] = useState<any>(null);

  // Load details when opening
  useEffect(() => {
    if (!open || !taskId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getTaskDetailsAction(taskId);
        setTask(data);
        setLocal({
          title: data.title ?? "",
          description: data.description ?? "",
          deadline: toDateInput(data.deadline ?? null),
          priority: String(data.priority ?? 2),
          status: data.status ?? "todo",
          category_id: data.category_id ?? "none",
          project_id: data.project_id ?? "none"
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось загрузить");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, taskId]);

  // Autosave debounce
  useEffect(() => {
    if (!open || !taskId || !local) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await updateTaskAction(taskId, {
          title: local.title?.trim() || "Без названия",
          description: local.description?.trim() || null,
          deadline: fromDateInput(local.deadline),
          priority: Number(local.priority ?? 2),
          status: local.status,
          category_id: local.category_id === "none" ? null : local.category_id,
          project_id: local.project_id === "none" ? null : local.project_id
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось сохранить");
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [open, taskId, local]);

  const content = (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={saving ? "today" : "default"}>{saving ? "Сохранение…" : "Автосохранение ✓"}</Badge>
        {task?.deadline ? <Badge>deadline: {toDateInput(task.deadline)}</Badge> : null}
      </div>

      {loading || !local ? (
        <div className="text-sm text-zinc-500">Загрузка…</div>
      ) : (
        <>
          <div className="grid gap-2">
            <Label>Название</Label>
            <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label>Описание</Label>
            <Textarea value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Дедлайн</Label>
              <Input type="date" value={local.deadline} onChange={(e) => setLocal({ ...local, deadline: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Приоритет</Label>
              <Select value={local.priority} onValueChange={(v) => setLocal({ ...local, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — высокий</SelectItem>
                  <SelectItem value="2">2 — средний</SelectItem>
                  <SelectItem value="3">3 — низкий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Статус</Label>
              <Select value={local.status} onValueChange={(v) => setLocal({ ...local, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">todo</SelectItem>
                  <SelectItem value="doing">doing</SelectItem>
                  <SelectItem value="done">done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Категория</Label>
              <Select value={local.category_id} onValueChange={(v) => setLocal({ ...local, category_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без категории</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Проект</Label>
            <Select value={local.project_id} onValueChange={(v) => setLocal({ ...local, project_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без проекта</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            {taskId ? <SubtaskList taskId={taskId} subtasks={task?.subtasks ?? []} /> : null}
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[640px] max-w-[92vw] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Задача</SheetTitle>
            <SheetDescription>Drawer/Sheet как Todoist.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Задача</DrawerTitle>
          <DrawerDescription>Редактор снизу (мобильно).</DrawerDescription>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
