"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () =>
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowser();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Аккаунт создан. Теперь войдите.");
        router.push("/login");
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка регистрации");
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт.</CardDescription>
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
        <Button onClick={onSubmit} disabled={isPending}>Создать</Button>
        <div className="text-sm text-zinc-500">
          Уже есть аккаунт?{" "}
          <Link className="font-medium text-zinc-900 hover:underline" href="/login">
            Войти
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
