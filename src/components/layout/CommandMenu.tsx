"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommandDialog } from "@/components/layout/CommandDialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { useUI } from "@/components/layout/ui-store";

export function CommandMenu() {
  const router = useRouter();
  const { isCommandOpen, closeCommand, openAdd } = useUI();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      if (isK && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        isCommandOpen ? closeCommand() : (window as any).__openCmd?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCommandOpen, closeCommand]);

  return (
    <CommandDialog open={isCommandOpen} onOpenChange={(o) => (!o ? closeCommand() : null)}>
      <Command>
        <CommandInput placeholder="Поиск… (например: задачи, статистика, добавить)" />
        <CommandList>
          <CommandEmpty>Ничего не найдено.</CommandEmpty>

          <CommandGroup heading="Навигация">
            <CommandItem onSelect={() => (closeCommand(), router.push("/dashboard"))}>Дашборд</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/tasks"))}>Задачи</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/projects"))}>Проекты</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/habits"))}>Привычки</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/notes"))}>Заметки</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/stats"))}>Статистика</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), router.push("/settings"))}>Настройки</CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Создать">
            <CommandItem onSelect={() => (closeCommand(), openAdd("task"))}>+ Задачу</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), openAdd("project"))}>+ Проект</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), openAdd("habit"))}>+ Привычку</CommandItem>
            <CommandItem onSelect={() => (closeCommand(), openAdd("note"))}>+ Заметку</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
