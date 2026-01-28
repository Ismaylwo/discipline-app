import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
import { TaskRulesService } from '../services/task-rules.service';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([]);
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Tables<'tasks'> | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.eq('completed', false);
      }

      if (statusFilter === 'completed') {
        query = query.eq('completed', true);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      const { data } = await query;
      const filtered = (data || []).filter((task) =>
        `${task.title} ${task.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
      );

      setTasks(filtered);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (task: Tables<'tasks'>) => {
    const completed = !task.completed;
    const completed_at = completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (!error) {
      if (completed) {
        await TaskRulesService.createNextRecurringTask(task);
      }
      fetchTasks();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await supabase.from('tasks').delete().in('id', selectedIds);
    setSelectedIds([]);
    fetchTasks();
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .in('id', selectedIds);
    setSelectedIds([]);
    fetchTasks();
  };

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;
    return { completed, pending };
  }, [tasks]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Задачи</h2>
          <p className="text-sm text-slate-400">Всего: {tasks.length}. Выполнено: {stats.completed}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setOpenModal(true);
            }}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
          >
            + Новая задача
          </button>
          <button
            type="button"
            onClick={handleBulkComplete}
            className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
          >
            Завершить выбранные
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
          >
            Удалить выбранные
          </button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск..."
          className="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="completed">Завершенные</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">Любой приоритет</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchTasks}
          className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Применить фильтры
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950">
        {loading && <p className="p-6 text-slate-400">Загрузка задач...</p>}
        {!loading && tasks.length === 0 && (
          <p className="p-6 text-slate-400">Нет задач по текущим фильтрам.</p>
        )}
        {!loading && tasks.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Выбор</th>
                <th className="px-4 py-3 text-left">Задача</th>
                <th className="px-4 py-3 text-left">Приоритет</th>
                <th className="px-4 py-3 text-left">Срок</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-900">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds((prev) => [...prev, task.id]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== task.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-100">{task.title}</span>
                      <span className="text-xs text-slate-500">{task.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {task.priority === 'high'
                      ? 'Высокий'
                      : task.priority === 'low'
                      ? 'Низкий'
                      : 'Средний'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Без срока'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        task.completed
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : 'bg-amber-500/20 text-amber-200'
                      }`}
                    >
                      {task.completed ? 'Выполнено' : 'В работе'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(task);
                        setOpenModal(true);
                      }}
                      className="text-primary-300 hover:text-primary-200"
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal
        open={openModal}
        title={editingTask ? 'Редактировать задачу' : 'Новая задача'}
        onClose={() => setOpenModal(false)}
      >
        <TaskForm
          task={editingTask}
          onSubmit={() => {
            setOpenModal(false);
            fetchTasks();
          }}
          onCancel={() => setOpenModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Tasks;
