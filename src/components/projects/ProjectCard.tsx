"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ProjectCard({
  p
}: {
  p: {
    project_id: string;
    title: string;
    deadline: string | null;
    progress: number;
    total_tasks?: number;
    done_tasks?: number;
  };
}) {
  const progress = Math.max(0, Math.min(100, Number(p.progress ?? 0)));

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      <Link
        href={`/projects/${p.project_id}`}
        className={cn("block rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-semibold">{p.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {p.deadline ? (
                <span className="inline-flex items-center gap-1 rounded-xl border bg-white px-2.5 py-0.5">
                  <Calendar className="h-3.5 w-3.5" /> {p.deadline}
                </span>
              ) : (
                <Badge>без дедлайна</Badge>
              )}
              {typeof p.total_tasks === "number" ? (
                <Badge>
                  {p.done_tasks ?? 0}/{p.total_tasks} done
                </Badge>
              ) : null}
            </div>
          </div>

          <Badge variant={progress >= 80 ? "success" : "default"}>{progress.toFixed(0)}%</Badge>
        </div>

        <div className="mt-4">
          <Progress value={progress} />
        </div>
      </Link>
    </motion.div>
  );
}
