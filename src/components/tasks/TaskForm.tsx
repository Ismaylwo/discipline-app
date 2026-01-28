import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Tables } from '../../types/database.types';
import { DataValidator } from '../../utils/validators';

interface TaskFormProps {
  task?: Tables<'tasks'> | null;
  initialType?: 'task' | 'habit';
  onSubmit: () => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, initialType = 'task', onSubmit, onCancel }) => {
  const recurrence = useMemo(() => (task?.recurrence || {}) as Record<string, any>, [task?.recurrence]);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
  const [isFrog, setIsFrog] = useState(task?.is_frog || false);
  const [estimatedTime, setEstimatedTime] = useState(task?.estimated_time?.toString() || '');
  const [taskType, setTaskType] = useState<'task' | 'habit'>((task?.type as 'task' | 'habit') || initialType);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(
    recurrence.type || (initialType === 'habit' ? 'daily' : 'none')
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(recurrence.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(recurrence.daysOfWeek || []);
  const [endDate, setEndDate] = useState(recurrence.endDate || '');
  const [tags, setTags] = useState((recurrence.tags || []).join(', '));
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(task?.category_id || '');
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [projectId, setProjectId] = useState(task?.project_id || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (taskType === 'habit' && recurrenceType === 'none') {
      setRecurrenceType('daily');
    }
  }, [taskType, recurrenceType]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = DataValidator.validateTaskData({ title, description, due_date: dueDate });
    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const recurrencePayload =
        recurrenceType && recurrenceType !== 'none'
          ? {
              type: recurrenceType,
              interval: recurrenceInterval,
              daysOfWeek: recurrenceType === 'weekly' ? daysOfWeek : undefined,
              endDate: endDate || undefined,
              tags: tags
                .split(',')
                .map((item: string) => item.trim())
                .filter(Boolean)
            }
          : null;

      const taskData = {
        title,
        description,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_frog: isFrog,
        category_id: selectedCategory || null,
        updated_at: new Date().toISOString(),
        type: taskType,
        estimated_time: estimatedTime ? Number(estimatedTime) : null,
        recurrence: recurrencePayload,
        project_id: projectId || null
      };

      if (task?.id) {
        const { error } = await supabase.from('tasks').update(taskData).eq('id', task.id);
        if (error) throw error;
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('Нет активной сессии');
        const { error } = await supabase
          .from('tasks')
          .insert([{ ...taskData, user_id: user.id }]);
        if (error) throw error;
      }

      onSubmit();
    } catch (error: any) {
      console.error('Ошибка сохранения задачи:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-200">
          Название задачи *
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="Что нужно сделать?"
        />
        {errors.title && <p className="mt-1 text-xs text-red-300">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-200">
          Описание
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="Дополнительные детали..."
        />
        {errors.description && <p className="mt-1 text-xs text-red-300">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taskType" className="block text-sm font-medium text-slate-200">
            Тип задачи
          </label>
          <select
            id="taskType"
            value={taskType}
            onChange={(event) => setTaskType(event.target.value as 'task' | 'habit')}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="task">Разовая</option>
            <option value="habit">Привычка</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-slate-200">
            Приоритет
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-slate-200">
            Срок выполнения
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
          {errors.due_date && <p className="mt-1 text-xs text-red-300">{errors.due_date}</p>}
        </div>
        <div>
          <label htmlFor="estimatedTime" className="block text-sm font-medium text-slate-200">
            Оценка времени (мин)
          </label>
          <input
            id="estimatedTime"
            type="number"
            value={estimatedTime}
            onChange={(event) => setEstimatedTime(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-200">
            Категория
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">Без категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-slate-200">
            Проект
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">Без проекта</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-slate-200">
          Метки (через запятую)
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Повторяемость</p>
            <p className="text-xs text-slate-500">Настройте повторяющиеся задачи и привычки.</p>
          </div>
          <select
            value={recurrenceType}
            onChange={(event) =>
              setRecurrenceType(event.target.value as 'none' | 'daily' | 'weekly' | 'monthly')
            }
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            <option value="none">Без повторений</option>
            <option value="daily">Ежедневно</option>
            <option value="weekly">По дням недели</option>
            <option value="monthly">Ежемесячно</option>
          </select>
        </div>
        {recurrenceType !== 'none' && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Интервал</label>
              <input
                type="number"
                value={recurrenceInterval}
                onChange={(event) => setRecurrenceInterval(Number(event.target.value))}
                min={1}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Дата окончания</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>
        )}
        {recurrenceType === 'weekly' && (
          <div className="flex flex-wrap gap-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(index === 6 ? 0 : index + 1)}
                className={`rounded-lg px-3 py-1 text-xs ${
                  daysOfWeek.includes(index === 6 ? 0 : index + 1)
                    ? 'bg-primary-500/20 text-primary-200'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="is-frog"
          type="checkbox"
          checked={isFrog}
          onChange={(event) => setIsFrog(event.target.checked)}
          className="h-4 w-4 rounded border-slate-600 text-primary-500"
        />
        <label htmlFor="is-frog" className="ml-2 text-sm text-slate-300">
          Пометить как "лягушку" (важная задача)
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-900"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-400 disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : task?.id ? 'Обновить' : 'Создать'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
