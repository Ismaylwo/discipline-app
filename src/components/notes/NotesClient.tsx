"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { NoteCard } from "./NoteCard";
import { NoteEditorPanel } from "./NoteEditorPanel";
import { Note } from "./types";
import { EmptyState } from "@/components/common/EmptyState";
import { useUI } from "@/components/layout/ui-store";

type Category = { id: string; name: string; color: string | null };
type Project = { id: string; title: string };

export function NotesClient({
  notes,
  categories,
  projects
}: {
  notes: Note[];
  categories: Category[];
  projects: Project[];
}) {
  const { openAdd } = useUI();
  const [open, setOpen] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);

  const onOpen = (id: string) => {
    setNoteId(id);
    setOpen(true);
  };

  if (!notes.length) {
    return (
      <EmptyState
        title="Пока нет заметок"
        description="Создайте заметку — идеи, дневник, план, что угодно."
        actionLabel="Добавить заметку"
        onAction={() => openAdd("note")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} categories={categories} projects={projects} onOpen={onOpen} />
          ))}
        </AnimatePresence>
      </div>

      <NoteEditorPanel
        open={open}
        noteId={noteId}
        onOpenChange={setOpen}
        initialNotes={notes}
        categories={categories}
        projects={projects}
      />
    </>
  );
}
