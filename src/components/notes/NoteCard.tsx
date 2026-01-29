"use client";

import { motion } from "framer-motion";
import { Pin, MoreHorizontal, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { deleteNoteAction, updateNoteAction } from "@/app/(app)/actions";
import { Note } from "./types";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function NoteCard({
  note,
  categories,
  projects,
  onOpen
}: {
  note: Note;
  categories: Category[];
  projects: Project[];
  onOpen: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const cat = categories.find((c) => c.id === note.category_id) ?? null;
  const proj = projects.find((p) => p.id === note.project_id) ?? null;

  const onPin = () =>
    startTransition(async () => {
      try {
        await updateNoteAction(note.id, { pinned: !note.pinned });
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось");
      }
    });

  const onDelete = () =>
    startTransition(async () => {
      try {
        await deleteNoteAction(note.id);
        toast.success("Удалено");
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось");
      }
    });

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
      <div
        className={cn("group cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md", note.pinned ? "border-amber-200" : "")}
        onClick={() => onOpen(note.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              <div className="truncate font-semibold">{note.title}</div>
              {note.pinned ? <Pin className="h-4 w-4 text-amber-600" /> : null}
            </div>

            <div className="mt-2 line-clamp-2 text-sm text-zinc-600">
              {note.content?.trim() ? note.content : "—"}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              {cat ? (
                <span className="inline-flex items-center gap-1 rounded-xl border bg-white px-2.5 py-0.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color ?? "#a1a1aa" }} />
                  {cat.name}
                </span>
              ) : null}
              {proj ? <Badge>{proj.title}</Badge> : null}
              <Badge>обновлено: {new Date(note.updated_at).toISOString().slice(0, 10)}</Badge>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-xl p-2 text-zinc-500 opacity-0 transition hover:bg-zinc-100 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onOpen(note.id)}>Открыть</DropdownMenuItem>
                <DropdownMenuItem onSelect={onPin}>{note.pinned ? "Открепить" : "Закрепить"}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete} className="text-red-600">
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
