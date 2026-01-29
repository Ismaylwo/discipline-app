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
import { updateNoteAction } from "@/app/(app)/actions";
import { Note } from "./types";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function NoteEditorPanel({
  open,
  noteId,
  onOpenChange,
  initialNotes,
  categories,
  projects
}: {
  open: boolean;
  noteId: string | null;
  onOpenChange: (o: boolean) => void;
  initialNotes: Note[];
  categories: Category[];
  projects: Project[];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const note = useMemo(() => initialNotes.find((n) => n.id === noteId) ?? null, [initialNotes, noteId]);
  const [local, setLocal] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !note) return;
    setLocal({
      title: note.title ?? "",
      content: note.content ?? "",
      pinned: note.pinned ?? false,
      category_id: note.category_id ?? "none",
      project_id: note.project_id ?? "none"
    });
  }, [open, noteId]);

  // Autosave debounce (600ms)
  useEffect(() => {
    if (!open || !noteId || !local) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        await updateNoteAction(noteId, {
          title: local.title?.trim() || "Без названия",
          content: local.content ?? "",
          pinned: Boolean(local.pinned),
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
  }, [open, noteId, local]);

  const content = (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={saving ? "today" : "default"}>{saving ? "Сохранение…" : "Автосохранение ✓"}</Badge>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={Boolean(local?.pinned)}
            onChange={(e) => setLocal({ ...local, pinned: e.target.checked })}
          />
          Закрепить
        </label>
      </div>

      <div className="grid gap-2">
        <Label>Заголовок</Label>
        <Input value={local?.title ?? ""} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
      </div>

      <div className="grid gap-2">
        <Label>Текст</Label>
        <Textarea
          className="min-h-[220px]"
          value={local?.content ?? ""}
          onChange={(e) => setLocal({ ...local, content: e.target.value })}
          placeholder="Пиши как в Notion (простой текст/markdown)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Категория</Label>
          <Select value={local?.category_id ?? "none"} onValueChange={(v) => setLocal({ ...local, category_id: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без категории</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Проект</Label>
          <Select value={local?.project_id ?? "none"} onValueChange={(v) => setLocal({ ...local, project_id: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без проекта</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[560px] max-w-[92vw] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Заметка</SheetTitle>
            <SheetDescription>Автосохранение каждые 600ms при изменениях.</SheetDescription>
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
          <DrawerTitle>Заметка</DrawerTitle>
          <DrawerDescription>Редактор снизу (мобильно).</DrawerDescription>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
