import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';

const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Tables<'tasks'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'habit')
        .order('created_at', { ascending: false });

      setHabits(data || []);
    } catch (error) {
      console.error('Ошибка загрузки привычек:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', today)
      .maybeSingle();

    const newValue = !(data?.completed ?? false);

    await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      date: today,
      completed: newValue,
      notes: null
    }, {
      onConflict: 'habit_id,date'
    });

    fetchHabits();
  };

  const getHabitStreak = async (habitId: string) => {
    const { data } = await supabase
      .from('habit_logs')
      .select('date, completed')
      .eq('habit_id', habitId)
      .order('date', { ascending: false })
      .limit(365);

    if (!data) return 0;

    let streak = 0;
    let current = new Date();

    for (let i = 0; i < 365; i += 1) {
      const dateStr = current.toISOString().split('T')[0];
      const log = data.find((item) => item.date === dateStr);
      if (!log || !log.completed) break;
      streak += 1;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Привычки</h2>
          <p className="text-sm text-slate-400">Отслеживайте регулярные действия.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
        >
          + Новая привычка
        </button>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        {loading && <p className="text-slate-400">Загрузка привычек...</p>}
        {!loading && habits.length === 0 && (
          <p className="text-slate-400">Пока нет привычек. Добавьте первую.</p>
        )}
        {!loading && habits.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} getStreak={getHabitStreak} />
            ))}
          </div>
        )}
      </section>

      <Modal open={openModal} title="Новая привычка" onClose={() => setOpenModal(false)}>
        <TaskForm
          initialType="habit"
          onSubmit={() => {
            setOpenModal(false);
            fetchHabits();
          }}
          onCancel={() => setOpenModal(false)}
        />
      </Modal>
    </div>
  );
};

type HabitCardProps = {
  habit: Tables<'tasks'>;
  onToggle: (habitId: string) => void;
  getStreak: (habitId: string) => Promise<number>;
};

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, getStreak }) => {
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('habit_logs')
        .select('completed')
        .eq('habit_id', habit.id)
        .eq('date', today)
        .maybeSingle();
      setTodayCompleted(Boolean(data?.completed));
      const newStreak = await getStreak(habit.id);
      setStreak(newStreak);
    };
    load();
  }, [habit.id, getStreak]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
          <p className="text-sm text-slate-400">{habit.description || 'Без описания'}</p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200">
          Серия: {streak} дней
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          setTodayCompleted((prev) => !prev);
          onToggle(habit.id);
        }}
        className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
          todayCompleted
            ? 'bg-emerald-500/20 text-emerald-200'
            : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
        }`}
      >
        {todayCompleted ? 'Отмечено сегодня' : 'Отметить выполнение'}
      </button>
    </div>
  );
};

export default Habits;
