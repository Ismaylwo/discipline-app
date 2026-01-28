import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';
import Modal from '../components/common/Modal';
import KanbanBoard from '../components/projects/KanbanBoard';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Tables<'projects'>[]>([]);
  const [selectedProject, setSelectedProject] = useState<Tables<'projects'> | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const projectsData = data || [];

      if (projectsData.length > 0) {
        const projectIds = projectsData.map((project) => project.id);
        const { data: tasks } = await supabase
          .from('tasks')
          .select('project_id, completed')
          .in('project_id', projectIds);

        const progressMap = new Map<string, number>();
        const counts = new Map<string, { total: number; done: number }>();

        (tasks || []).forEach((task) => {
          if (!task.project_id) return;
          const current = counts.get(task.project_id) || { total: 0, done: 0 };
          current.total += 1;
          if (task.completed) current.done += 1;
          counts.set(task.project_id, current);
        });

        counts.forEach((value, key) => {
          const progress = value.total === 0 ? 0 : Math.round((value.done / value.total) * 100);
          progressMap.set(key, progress);
        });

        const withProgress = projectsData.map((project) => ({
          ...project,
          progress: progressMap.get(project.id) ?? project.progress ?? 0
        }));
        setProjects(withProgress);
        if (!selectedProject && withProgress.length > 0) {
          setSelectedProject(withProgress[0]);
        }
      } else {
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const projectStats = useMemo(() => {
    const active = projects.filter((project) => project.status === 'active').length;
    const completed = projects.filter((project) => project.status === 'completed').length;
    return { active, completed };
  }, [projects]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Проекты</h2>
          <p className="text-sm text-slate-400">
            Активные: {projectStats.active} · Завершенные: {projectStats.completed}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
        >
          + Новый проект
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-300">Список проектов</h3>
          {loading && <p className="mt-4 text-sm text-slate-400">Загрузка...</p>}
          {!loading && projects.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">Добавьте первый проект.</p>
          )}
          <div className="mt-4 space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProject(project)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selectedProject?.id === project.id
                    ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                    : 'border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{project.title}</span>
                  <span className="text-xs text-slate-400">{project.progress || 0}%</span>
                </div>
                <p className="text-xs text-slate-500">{project.status}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          {selectedProject ? (
            <>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedProject.title}</h3>
                  <p className="text-sm text-slate-400">{selectedProject.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300">
                    Дедлайн: {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'Без срока'}
                  </span>
                  <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs text-primary-200">
                    {selectedProject.progress || 0}%
                  </span>
                </div>
              </div>
              <KanbanBoard projectId={selectedProject.id} onChange={fetchProjects} />
            </>
          ) : (
            <p className="text-sm text-slate-400">Выберите проект для просмотра доски.</p>
          )}
        </div>
      </section>

      <ProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={() => {
          setOpenModal(false);
          fetchProjects();
        }}
      />
    </div>
  );
};

type ProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const ProjectModal: React.FC<ProjectModalProps> = ({ open, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    setLoading(true);
    await supabase.from('projects').insert({
      user_id: user.id,
      title,
      description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      color,
      status,
      progress: 0
    });
    setLoading(false);
    setTitle('');
    setDescription('');
    setDeadline('');
    setColor('#8b5cf6');
    setStatus('active');
    onSaved();
  };

  return (
    <Modal open={open} title="Новый проект" onClose={onClose}>
      <form onSubmit={saveProject} className="space-y-4">
        <div>
          <label className="text-sm text-slate-300">Название проекта</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            required
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Описание</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Дедлайн</label>
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Статус</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="planning">Планирование</option>
              <option value="active">Активный</option>
              <option value="completed">Завершен</option>
              <option value="archived">Архив</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-300">Цвет проекта</label>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-800 bg-slate-950"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400 disabled:opacity-60"
        >
          {loading ? 'Сохранение...' : 'Создать проект'}
        </button>
      </form>
    </Modal>
  );
};

export default Projects;
