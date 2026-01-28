import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { supabase } from '../../services/supabase';
import { Tables } from '../../types/database.types';

interface KanbanBoardProps {
  projectId: string;
  onChange?: () => void;
}

type ColumnId = 'todo' | 'in_progress' | 'review' | 'done';

type Column = {
  id: ColumnId;
  title: string;
  wipLimit?: number;
};

const COLUMNS: Column[] = [
  { id: 'todo', title: 'К выполнению' },
  { id: 'in_progress', title: 'В работе', wipLimit: 3 },
  { id: 'review', title: 'На проверке' },
  { id: 'done', title: 'Готово' }
];

const getTaskStatus = (task: Tables<'tasks'>): ColumnId => {
  if (task.completed) return 'done';
  const meta = (task.recurrence || {}) as { kanbanStatus?: ColumnId };
  return meta.kanbanStatus || 'todo';
};

const setTaskStatusPayload = (task: Tables<'tasks'>, status: ColumnId) => {
  const meta = (task.recurrence || {}) as Record<string, any>;
  return {
    recurrence: { ...meta, kanbanStatus: status },
    completed: status === 'done',
    completed_at: status === 'done' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, onChange }) => {
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([]);
  const [loading, setLoading] = useState(true);

  const tasksByColumn = useMemo(() => {
    const map: Record<ColumnId, Tables<'tasks'>[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };

    tasks.forEach((task) => {
      const status = getTaskStatus(task);
      map[status].push(task);
    });

    return map;
  }, [tasks]);

  const fetchProjectTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error) {
      setTasks(data || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchProjectTasks();
  }, [fetchProjectTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    const activeColumn = getTaskStatus(activeTask);
    const overColumn =
      (COLUMNS.find((column) => column.id === overId)?.id as ColumnId) ||
      (Object.entries(tasksByColumn).find(([, items]) => items.some((task) => task.id === overId))?.[0] as
        | ColumnId
        | undefined);

    if (!overColumn) return;

    if (activeColumn === overColumn) {
      if (COLUMNS.some((column) => column.id === overId)) {
        return;
      }
      const columnTasks = tasksByColumn[activeColumn];
      const oldIndex = columnTasks.findIndex((task) => task.id === activeId);
      const newIndex = columnTasks.findIndex((task) => task.id === overId);
      if (oldIndex === newIndex) return;

      const newOrder = arrayMove(columnTasks, oldIndex, newIndex);
      const otherTasks = tasks.filter((task) => getTaskStatus(task) !== activeColumn);
      setTasks([...otherTasks, ...newOrder]);
      return;
    }

    const targetColumn = COLUMNS.find((column) => column.id === overColumn);
    if (targetColumn?.wipLimit && tasksByColumn[overColumn].length >= targetColumn.wipLimit) {
      alert(`Достигнут лимит задач в колонке "${targetColumn.title}" (${targetColumn.wipLimit}).`);
      return;
    }

    const updated = tasks.map((task) =>
      task.id === activeId ? { ...task, ...setTaskStatusPayload(task, overColumn) } : task
    );
    setTasks(updated);

    await supabase
      .from('tasks')
      .update(setTaskStatusPayload(activeTask, overColumn))
      .eq('id', activeId);

    if (onChange) onChange();
  };

  if (loading) {
    return <div className="mt-6 text-slate-400">Загрузка доски...</div>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
      <DndContext onDragEnd={handleDragEnd}>
        {COLUMNS.map((column) => (
          <KanbanColumn key={column.id} column={column} tasks={tasksByColumn[column.id]}>
            <SortableContext items={tasksByColumn[column.id].map((task) => task.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {tasksByColumn[column.id].map((task) => (
                  <SortableCard key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}
      </DndContext>
    </div>
  );
};

type SortableCardProps = {
  task: Tables<'tasks'>;
};

type KanbanColumnProps = {
  column: Column;
  tasks: Tables<'tasks'>[];
  children: React.ReactNode;
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-slate-800 bg-slate-950 p-3 ${isOver ? 'bg-slate-900/70' : ''}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">{column.title}</h4>
        <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400">{tasks.length}</span>
      </div>
      {children}
    </div>
  );
};

const SortableCard: React.FC<SortableCardProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-100"
    >
      <div className="flex items-center justify-between">
        <span>{task.title}</span>
        <span className="text-xs text-slate-400">
          {task.priority === 'high' ? 'Высокий' : task.priority === 'low' ? 'Низкий' : 'Средний'}
        </span>
      </div>
      {task.description && <p className="mt-2 text-xs text-slate-400">{task.description}</p>}
    </div>
  );
};

export default KanbanBoard;
