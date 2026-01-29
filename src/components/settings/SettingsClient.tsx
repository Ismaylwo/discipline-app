"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SettingsClient() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("discipline_theme") as any) || "light";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("discipline_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    toast.success(`Тема: ${next}`);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4">
      <div>
        <div className="font-medium">Тема</div>
        <div className="text-sm text-zinc-500">Локально (localStorage) — бесплатно и просто.</div>
      </div>
      <Button variant="secondary" onClick={toggle}>
        {theme === "light" ? "Включить тёмную" : "Включить светлую"}
      </Button>
    </div>
  );
}
