"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSubtaskAction, deleteSubtaskAction, toggleSubtaskAction } from "@/app/(app)/actions";

type Subtask = {
  id: string;
  title: string;
  is_done: boolean;
};

export function SubtaskList({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const [items, setItems] = useState<Subtask[]>(subtasks);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const add = () =>
    startTransition(async () => {
      const t = title.trim();
      if (!t) return;
      try {
        const created = await createSubtaskAction(taskId, t);
        setItems([{ id: created.id, title: created.title, is_done: created.is_done }, ...items]);
        setTitle("");
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось добавить");
      }
    });

  const toggle = (id: string, done: boolean) =>
    startTransition(async () => {
      try {
        await toggleSubtaskAction(id, done);
        setItems(items.map((s) => (s.id === id ? { ...s, is_done: done } : s)));
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось обновить");
      }
    });

  const del = (id: string) =>
    startTransition(async () => {
      try {
        await deleteSubtaskAction(id);
        setItems(items.filter((s) => s.id !== id));
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось удалить");
      }
    });

  return (
    <div className="grid gap-3">
      <div className="text-sm font-medium">Подзадачи</div>

      <div className="flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Новая подзадача…" />
        <Button variant="secondary" onClick={add} disabled={isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length ? (
        <div className="grid gap-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <Checkbox checked={s.is_done} onCheckedChange={(v) => toggle(s.id, Boolean(v))} />
              <div className={s.is_done ? "line-through text-zinc-500" : ""}>{s.title}</div>
              <button className="ml-auto rounded-lg p-1 text-zinc-500 hover:bg-zinc-100" onClick={() => del(s.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-zinc-500">Подзадач пока нет.</div>
      )}
    </div>
  );
}
