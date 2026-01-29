"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Task } from "./types";
import { TaskCard } from "./TaskCard";
import { TaskDetailsPanel } from "./TaskDetailsPanel";
import { EmptyState } from "@/components/common/EmptyState";
import { useUI } from "@/components/layout/ui-store";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function TaskList({
  tasks,
  categories,
  projects,
  emptyTitle = "Нет задач",
  emptyDescription = "Добавьте задачу и начните отмечать прогресс."
}: {
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { openAdd } = useUI();
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const onOpen = (id: string) => {
    setTaskId(id);
    setOpen(true);
  };

  if (!tasks.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel="Добавить задачу"
        onAction={() => openAdd("task")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3">
        <AnimatePresence>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} categories={categories} projects={projects} onOpen={onOpen} />
          ))}
        </AnimatePresence>
      </div>

      <TaskDetailsPanel open={open} taskId={taskId} onOpenChange={setOpen} categories={categories} projects={projects} />
    </>
  );
}
