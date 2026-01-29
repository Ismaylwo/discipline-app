"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () =>
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowser();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Вход выполнен");
        router.push(next);
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка входа");
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход</CardTitle>
        <CardDescription>Войдите в аккаунт, чтобы видеть свои задачи.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" />
        </div>
        <div className="grid gap-2">
          <Label>Пароль</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button onClick={onSubmit} disabled={isPending}>Войти</Button>
        <div className="text-sm text-zinc-500">
          Нет аккаунта?{" "}
          <Link className="font-medium text-zinc-900 hover:underline" href="/signup">
            Регистрация
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
