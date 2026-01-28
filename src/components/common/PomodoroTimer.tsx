import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Tables } from '../../types/database.types';

const PomodoroTimer: React.FC = () => {
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [cyclesBeforeLong, setCyclesBeforeLong] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [mode, setMode] = useState<'work' | 'break' | 'long'>('work');
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(20);
      setTasks(data || []);
    };
    loadTasks();
  }, []);

  const handleComplete = useCallback(async () => {
    setRunning(false);

    if (mode === 'work') {
      if (currentCycle >= cyclesBeforeLong) {
        setMode('long');
        setCurrentCycle(1);
      } else {
        setMode('break');
        setCurrentCycle((prev) => prev + 1);
      }
    } else {
      setMode('work');
    }

    if (mode === 'work' && selectedTask) {
      const { data } = await supabase.from('tasks').select('recurrence').eq('id', selectedTask).single();
      const meta = (data?.recurrence || {}) as Record<string, any>;
      const pomodoros = (meta.pomodoros || 0) + 1;
      const timeSpent = (meta.timeSpent || 0) + workMinutes;

      await supabase
        .from('tasks')
        .update({
          recurrence: { ...meta, pomodoros, timeSpent },
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTask);
    }
  }, [mode, currentCycle, cyclesBeforeLong, selectedTask, workMinutes]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, handleComplete]);

  useEffect(() => {
    if (!running) {
      const nextSeconds =
        mode === 'work' ? workMinutes * 60 : mode === 'break' ? breakMinutes * 60 : longBreakMinutes * 60;
      setSecondsLeft(nextSeconds);
    }
  }, [workMinutes, breakMinutes, longBreakMinutes, mode, running]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Фокус-таймер</h3>
        <span className="text-xs text-slate-500">Цикл {currentCycle}/{cyclesBeforeLong}</span>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase text-slate-500">
          {mode === 'work' ? 'Работа' : mode === 'break' ? 'Перерыв' : 'Длинный перерыв'}
        </p>
        <p className="text-4xl font-semibold text-white mt-2">{formattedTime}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((prev) => !prev)}
          className="flex-1 rounded-lg bg-primary-500 py-2 text-sm font-semibold text-white hover:bg-primary-400"
        >
          {running ? 'Пауза' : 'Старт'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setMode('work');
            setCurrentCycle(1);
          }}
          className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Сброс
        </button>
      </div>
      <div>
        <label className="text-xs text-slate-400">Связать с задачей</label>
        <select
          value={selectedTask}
          onChange={(event) => setSelectedTask(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Без задачи</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <label>
          Работа (мин)
          <input
            type="number"
            min={10}
            value={workMinutes}
            onChange={(event) => setWorkMinutes(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </label>
        <label>
          Перерыв (мин)
          <input
            type="number"
            min={3}
            value={breakMinutes}
            onChange={(event) => setBreakMinutes(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </label>
        <label>
          Длинный (мин)
          <input
            type="number"
            min={10}
            value={longBreakMinutes}
            onChange={(event) => setLongBreakMinutes(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </label>
        <label>
          Циклов до длинного
          <input
            type="number"
            min={2}
            value={cyclesBeforeLong}
            onChange={(event) => setCyclesBeforeLong(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </label>
      </div>
    </div>
  );
};

export default PomodoroTimer;
