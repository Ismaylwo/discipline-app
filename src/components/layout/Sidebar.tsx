"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, FolderKanban, Flame, StickyNote, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/projects", label: "Проекты", icon: FolderKanban },
  { href: "/habits", label: "Привычки", icon: Flame },
  { href: "/notes", label: "Заметки", icon: StickyNote },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
      <div className="p-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-lg font-semibold">Discipline</div>
          <div className="mt-1 text-sm text-zinc-500">Notion/Todoist style</div>
        </div>
      </div>
      <nav className="px-2">
        {nav.map((i) => {
          const active = pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href));
          const Icon = i.icon;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50",
                active ? "bg-zinc-100 text-zinc-900" : ""
              )}
            >
              <Icon className="h-4 w-4" />
              {i.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-zinc-500">
        <div>⌘/Ctrl + K — команды</div>
      </div>
    </aside>
  );
}
