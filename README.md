# Discipline (MVP) — Tasks / Projects / Habits / Notes

Стек: **Next.js (App Router)** + **Supabase (Auth + Postgres)** + **Tailwind** + shadcn-like UI + **Drawer/Sheet** + **Framer Motion** + **Recharts**.

## 1) Где вводить команды?
Самый простой способ — **VS Code**:
1) Открой папку проекта в VS Code  
2) Меню: **Terminal → New Terminal**  
3) Команды вводишь в терминал снизу

На Windows можно и так: **Win → PowerShell** (и перейти в папку проекта командой `cd`).

## 2) Установка и запуск (локально)
В терминале, находясь в папке проекта:

```bash
npm install
npm run dev
```

Открой: http://localhost:3000

## 3) Подключение Supabase (чтобы работали регистрация и база)
1) Создай проект в Supabase: https://supabase.com  
2) В **Project Settings → API** возьми:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3) В корне проекта создай файл **.env.local** и вставь:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4) В Supabase открой **SQL Editor** и выполни:
   - `supabase/schema.sql`
   - `supabase/stats.sql` (RPC для статистики/прогресса; опционально, но рекомендуется)

## 4) Что реализовано
- Регистрация/вход (Supabase Auth)
- **Задачи:** chips (Today/Overdue/Week/Done), поиск, фильтры, карточки + Drawer/Sheet деталей, подзадачи
- **Проекты:** прогресс по задачам + страница проекта
- **Привычки:** отметка сегодня
- **Заметки:** карточки + редактор Drawer/Sheet с автосохранением
- **Статистика:** графики (через RPC функции)

## 5) Частые ошибки
- **Пустая страница / ошибки Supabase:** проверь `.env.local` и что ты перезапустил `npm run dev` после добавления переменных.
- **RLS блокирует доступ:** убедись, что выполнил `schema.sql` и включены policies.
