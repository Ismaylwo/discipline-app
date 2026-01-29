"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Command as CommandIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/layout/ui-store";
import { createHabitAction, createNoteAction, createProjectAction, createTaskAction } from "@/app/(app)/actions";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function Topbar({ categories, projects }: { categories: Category[]; projects: Project[] }) {
  const router = useRouter();
  const { isAddOpen, addTab, openAdd, closeAdd, openCommand } = useUI();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tDate, setTDate] = useState("");
  const [tPri, setTPri] = useState<"1" | "2" | "3">("2");
  const [tCat, setTCat] = useState("none");
  const [tProj, setTProj] = useState("none");

  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDate, setPDate] = useState("");
  const [pCat, setPCat] = useState("none");

  const [hTitle, setHTitle] = useState("");

  const [nTitle, setNTitle] = useState("");
  const [nContent, setNContent] = useState("");
  const [nPinned, setNPinned] = useState(false);
  const [nCat, setNCat] = useState("none");
  const [nProj, setNProj] = useState("none");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openAdd("task");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAdd]);

  const toIsoFromDate = (dateStr: string) => (dateStr ? new Date(`${dateStr}T12:00:00+05:00`).toISOString() : null);

  const reset = () => {
    setTTitle(""); setTDesc(""); setTDate(""); setTPri("2"); setTCat("none"); setTProj("none");
    setPTitle(""); setPDesc(""); setPDate(""); setPCat("none");
    setHTitle("");
    setNTitle(""); setNContent(""); setNPinned(false); setNCat("none"); setNProj("none");
  };

  const onCreateTask = () =>
    startTransition(async () => {
      try {
        await createTaskAction({
          title: tTitle.trim() || "Без названия",
          description: tDesc.trim() || undefined,
          deadline: toIsoFromDate(tDate),
          priority: Number(tPri) as any,
          category_id: tCat === "none" ? null : tCat,
          project_id: tProj === "none" ? null : tProj
        });
        toast.success("Задача создана");
        closeAdd();
        reset();
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });

  const onCreateProject = () =>
    startTransition(async () => {
      try {
        await createProjectAction({
          title: pTitle.trim() || "Без названия",
          description: pDesc.trim() || undefined,
          deadline: toIsoFromDate(pDate),
          category_id: pCat === "none" ? null : pCat
        });
        toast.success("Проект создан");
        closeAdd();
        reset();
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });

  const onCreateHabit = () =>
    startTransition(async () => {
      try {
        await createHabitAction({ title: hTitle.trim() || "Без названия" });
        toast.success("Привычка создана");
        closeAdd();
        reset();
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });

  const onCreateNote = () =>
    startTransition(async () => {
      try {
        await createNoteAction({
          title: nTitle.trim() || "Без названия",
          content: nContent ?? "",
          pinned: nPinned,
          category_id: nCat === "none" ? null : nCat,
          project_id: nProj === "none" ? null : nProj
        });
        toast.success("Заметка создана");
        closeAdd();
        reset();
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка");
      }
    });

  return (
    <header className="sticky top-0 z-30 border-b bg-white px-4 py-3 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <button
            onClick={openCommand}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 hover:bg-zinc-50"
            title="Ctrl/⌘ + K"
          >
            <CommandIcon className="h-4 w-4" />
            Команды
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => openAdd("task")}>
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={(o) => (!o ? closeAdd() : openAdd(addTab))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить</DialogTitle>
            <DialogDescription>Как Todoist/Notion: задача, проект, привычка или заметка.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue={addTab}>
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="task">Задача</TabsTrigger>
              <TabsTrigger className="flex-1" value="project">Проект</TabsTrigger>
              <TabsTrigger className="flex-1" value="habit">Привычка</TabsTrigger>
              <TabsTrigger className="flex-1" value="note">Заметка</TabsTrigger>
            </TabsList>

            <TabsContent value="task" className="grid gap-4">
              <div className="grid gap-2">
                <Label>Название</Label>
                <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Например: Сделать спорт" />
              </div>
              <div className="grid gap-2">
                <Label>Описание</Label>
                <Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} placeholder="Опционально" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Дедлайн</Label>
                  <Input type="date" value={tDate} onChange={(e) => setTDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Приоритет</Label>
                  <Select value={tPri} onValueChange={(v) => setTPri(v as any)}>
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
                  <Label>Категория</Label>
                  <Select value={tCat} onValueChange={setTCat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без категории</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Проект</Label>
                  <Select value={tProj} onValueChange={setTProj}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без проекта</SelectItem>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => closeAdd()}>Отмена</Button>
                <Button onClick={onCreateTask} disabled={isPending}>Создать</Button>
              </div>
            </TabsContent>

            <TabsContent value="project" className="grid gap-4">
              <div className="grid gap-2">
                <Label>Название</Label>
                <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Например: Английский" />
              </div>
              <div className="grid gap-2">
                <Label>Описание</Label>
                <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Опционально" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Дедлайн</Label>
                  <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Категория</Label>
                  <Select value={pCat} onValueChange={setPCat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без категории</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => closeAdd()}>Отмена</Button>
                <Button onClick={onCreateProject} disabled={isPending}>Создать</Button>
              </div>
            </TabsContent>

            <TabsContent value="habit" className="grid gap-4">
              <div className="grid gap-2">
                <Label>Название привычки</Label>
                <Input value={hTitle} onChange={(e) => setHTitle(e.target.value)} placeholder="Например: Читать 20 мин" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => closeAdd()}>Отмена</Button>
                <Button onClick={onCreateHabit} disabled={isPending}>Создать</Button>
              </div>
            </TabsContent>

            <TabsContent value="note" className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-600">Заметка (как карточка Notion)</div>
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input type="checkbox" checked={nPinned} onChange={(e) => setNPinned(e.target.checked)} />
                  Закрепить
                </label>
              </div>
              <div className="grid gap-2">
                <Label>Заголовок</Label>
                <Input value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="Например: Идеи" />
              </div>
              <div className="grid gap-2">
                <Label>Текст</Label>
                <Textarea value={nContent} onChange={(e) => setNContent(e.target.value)} placeholder="Пиши мысли…" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Категория</Label>
                  <Select value={nCat} onValueChange={setNCat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без категории</SelectItem>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Проект</Label>
                  <Select value={nProj} onValueChange={setNProj}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без проекта</SelectItem>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => closeAdd()}>Отмена</Button>
                <Button onClick={onCreateNote} disabled={isPending}>Создать</Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </header>
  );
}
