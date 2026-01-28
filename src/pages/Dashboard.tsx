import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import DashboardCharts from '../components/statistics/DashboardCharts';
import PomodoroTimer from '../components/common/PomodoroTimer';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([]);
  const [habits, setHabits] = useState<Tables<'tasks'>[]>([]);
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .limit(5);

      const habitsQuery = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'habit')
        .limit(5);

      const projectsQuery = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })
        .limit(4);

      const [tasksResult, habitsResult, projectsResult] = await Promise.all([
        tasksQuery,
        habitsQuery,
        projectsQuery
      ]);

      setTasks(tasksResult.data || []);
      setHabits(habitsResult.data || []);
      setProjects(projectsResult.data || []);
    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.filter((task) => !task.completed).length;
    return { completed, pending };
  }, [tasks]);

  if (loading) {
    return <div className="text-slate-300">Загрузка дашборда...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Планы на сегодня</h2>
              <p className="mt-2 text-sm text-slate-400">
                Следите за ключевыми задачами и привычками.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenTaskModal(true)}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
            >
              + Быстрая задача
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Выполнено сегодня</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.completed}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Осталось задач</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.pending}</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            “Маленькие шаги каждый день дают большие результаты.” — мотивация дня
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">Ближайшие задачи</h3>
            <div className="mt-3 space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Без срока'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {task.priority === 'high'
                      ? 'Высокий'
                      : task.priority === 'low'
                      ? 'Низкий'
                      : 'Средний'}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-slate-500">Нет задач на сегодня.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-sm font-semibold text-slate-300">Привычки</h3>
            <div className="mt-4 space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="rounded-lg border border-slate-800 px-3 py-2">
                  <p className="text-sm text-white">{habit.title}</p>
                  <p className="text-xs text-slate-500">{habit.description || 'Без описания'}</p>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="text-sm text-slate-500">Добавьте первую привычку.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h3 className="text-sm font-semibold text-slate-300">Проекты</h3>
            <div className="mt-4 space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="rounded-lg border border-slate-800 px-3 py-2">
                  <p className="text-sm text-white">{project.title}</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-slate-500">Создайте первый проект.</p>
              )}
            </div>
          </div>
          <PomodoroTimer />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <DashboardCharts />
      </section>

      <Modal
        open={openTaskModal}
        title="Быстрое добавление задачи"
        onClose={() => setOpenTaskModal(false)}
      >
        <TaskForm
          onSubmit={() => {
            setOpenTaskModal(false);
            fetchDashboard();
          }}
          onCancel={() => setOpenTaskModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
