import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { supabase } from '../../services/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const DashboardCharts: React.FC = () => {
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    pending: 0,
    overdue: 0
  });
  const [habitStreak, setHabitStreak] = useState(0);
  const [dailyCompletion, setDailyCompletion] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId);

      const completed = tasks?.filter((task) => task.completed).length || 0;
      const pending = tasks?.filter((task) => !task.completed).length || 0;
      const overdue =
        tasks?.filter(
          (task) => !task.completed && task.due_date && new Date(task.due_date) < new Date()
        ).length || 0;

      const { data: habits } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .order('date', { ascending: false });

      let currentStreak = 0;
      if (habits && habits.length > 0) {
        let checkDate = new Date();
        for (let i = 0; i < 365; i += 1) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const dayLogs = habits.filter((habit) => habit.date === dateStr);
          if (dayLogs.length === 0 || !dayLogs.every((habit) => habit.completed)) {
            break;
          }
          currentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      const dailyStats: number[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', `${dateStr}T00:00:00`)
          .lte('completed_at', `${dateStr}T23:59:59`);

        dailyStats.push(count || 0);
      }

      setTaskStats({ completed, pending, overdue });
      setHabitStreak(currentStreak);
      setDailyCompletion(dailyStats);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const taskData = {
    labels: ['Выполнено', 'В ожидании', 'Просрочено'],
    datasets: [
      {
        label: 'Количество задач',
        data: [taskStats.completed, taskStats.pending, taskStats.overdue],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)', 'rgba(239, 68, 68, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)'],
        borderWidth: 1
      }
    ]
  };

  const dailyData = {
    labels: ['-6д', '-5д', '-4д', '-3д', '-2д', '-1д', 'Сегодня'],
    datasets: [
      {
        label: 'Выполнено задач',
        data: dailyCompletion,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.4
      }
    ]
  };

  if (loading) {
    return <div className="text-slate-400">Загрузка статистики...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Распределение задач</h3>
        <div className="h-64">
          <Pie
            data={taskData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#e2e8f0' }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Продуктивность по дням</h3>
          <div className="bg-primary-500/20 text-primary-200 text-sm font-semibold px-3 py-1 rounded-full">
            Серия: {habitStreak} дней
          </div>
        </div>
        <div className="h-64">
          <Line
            data={dailyData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: '#94a3b8' },
                  grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                x: {
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
              },
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ключевые метрики</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-emerald-200">{taskStats.completed}</div>
            <div className="text-sm text-emerald-300">Задач выполнено</div>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-amber-200">{taskStats.pending}</div>
            <div className="text-sm text-amber-300">Задач в работе</div>
          </div>
          <div className="bg-primary-500/10 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary-200">{habitStreak}</div>
            <div className="text-sm text-primary-300">Дней серии привычек</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
