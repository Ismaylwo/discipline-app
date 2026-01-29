import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(app)/actions";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
          <CardDescription>Аккаунт и поведение приложения</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="text-sm text-zinc-600">
            Вы вошли как: <span className="font-medium text-zinc-900">{data.user?.email ?? "—"}</span>
          </div>
          <SettingsClient />
        </CardContent>
      </Card>

      <form action={logoutAction}>
        <Button variant="destructive" type="submit">
          Выйти
        </Button>
      </form>
    </div>
  );
}
