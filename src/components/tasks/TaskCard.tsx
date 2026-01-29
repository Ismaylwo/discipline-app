"use client";

import { useMemo, useTransition } from "react";
import { motion } from "framer-motion";
import { Calendar, MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toggleTaskDoneAction, deleteTaskAction, duplicateTaskAction } from "@/app/(app)/actions";
import { Task } from "./types";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function TaskCard({
  task,
  categories,
  projects,
  onOpen
}: {
  task: Task;
  categories: Category[];
  projects: Project[];
  onOpen: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const cat = useMemo(() => categories.find((c) => c.id === task.category_id) ?? null, [categories, task.category_id]);
  const proj = useMemo(() => projects.find((p) => p.id === task.project_id) ?? null, [projects, task.project_id]);

  const onToggle = (done: boolean) =>
    startTransition(async () => {
      try {
        await toggleTaskDoneAction(task.id, done);
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось");
      }
    });

  const onDelete = () =>
    startTransition(async () => {
      try {
        await deleteTaskAction(task.id);
        toast.success("Удалено");
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось");
      }
    });

  const onDuplicate = () =>
    startTransition(async () => {
      try {
        await duplicateTaskAction(task.id);
        toast.success("Скопировано");
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось");
      }
    });

  const deadline = task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : null;
  const isDone = task.status === "done";

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
      <div
        className={cn(
          "group flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md",
          isDone ? "opacity-70" : ""
        )}
      >
        <div className="pt-1">
          <Checkbox checked={isDone} onCheckedChange={(v) => onToggle(Boolean(v))} />
        </div>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpen(task.id)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={cn("truncate font-semibold", isDone ? "line-through text-zinc-500" : "")}>{task.title}</div>
              {task.description ? <div className="mt-1 line-clamp-2 text-sm text-zinc-600">{task.description}</div> : null}
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-xl p-2 text-zinc-500 opacity-0 transition hover:bg-zinc-100 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onOpen(task.id)}>Открыть</DropdownMenuItem>
                  <DropdownMenuItem onSelect={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" /> Дублировать
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {deadline ? (
              <span className="inline-flex items-center gap-1 rounded-xl border bg-white px-2.5 py-0.5">
                <Calendar className="h-3.5 w-3.5" /> {deadline}
              </span>
            ) : null}

            <Badge variant={task.priority === 1 ? "overdue" : task.priority === 2 ? "today" : "default"}>
              pri: {task.priority}
            </Badge>

            {cat ? (
              <span className="inline-flex items-center gap-1 rounded-xl border bg-white px-2.5 py-0.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#a1a1aa" }} />
                {cat.name}
              </span>
            ) : (
              <Badge>Без категории</Badge>
            )}

            {proj ? <Badge>{proj.title}</Badge> : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
