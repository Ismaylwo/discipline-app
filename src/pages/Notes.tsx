import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Tables<'notes'>[]>([]);
  const [selected, setSelected] = useState<Tables<'notes'> | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      setNotes(data || []);
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const openNote = (note: Tables<'notes'>) => {
    setSelected(note);
    setTitle(note.title);
    setContent(note.content || '');
  };

  const createNote = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: 'Новая заметка',
        content: '',
        is_pinned: false
      })
      .select()
      .single();

    if (data) {
      setNotes((prev) => [data, ...prev]);
      openNote(data);
    }
  };

  const saveNote = async () => {
    if (!selected) return;

    const { data } = await supabase
      .from('notes')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', selected.id)
      .select()
      .single();

    if (data) {
      setNotes((prev) => prev.map((note) => (note.id === data.id ? data : note)));
      setSelected(data);
    }
  };

  const convertToTask = async () => {
    if (!selected) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase.from('tasks').insert({
      user_id: user.id,
      title: title || 'Задача из заметки',
      description: content,
      type: 'task',
      priority: 'medium',
      created_at: new Date().toISOString()
    });
  };

  const togglePin = async (note: Tables<'notes'>) => {
    const { data } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id)
      .select()
      .single();

    if (data) {
      setNotes((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      if (selected?.id === data.id) {
        setSelected(data);
      }
    }
  };

  const deleteNote = async () => {
    if (!selected) return;
    await supabase.from('notes').delete().eq('id', selected.id);
    setSelected(null);
    setTitle('');
    setContent('');
    fetchNotes();
  };

  const filteredNotes = notes.filter((note) =>
    `${note.title} ${note.content ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Заметки</h2>
          <p className="text-sm text-slate-400">Храните мысли и материалы по проектам.</p>
        </div>
        <button
          type="button"
          onClick={createNote}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
        >
          + Новая заметка
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по заметкам"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
          />
          <div className="mt-4 space-y-2">
            {loading && <p className="text-sm text-slate-400">Загрузка...</p>}
            {!loading && filteredNotes.length === 0 && (
              <p className="text-sm text-slate-400">Нет заметок.</p>
            )}
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => openNote(note)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selected?.id === note.id
                    ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                    : 'border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{note.title}</span>
                  {note.is_pinned && <span className="text-xs text-amber-300">Закреплено</span>}
                </div>
                <p className="text-xs text-slate-500">{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          {selected ? (
            <div className="space-y-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-lg text-slate-100"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={12}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="Markdown поддерживается..."
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveNote}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-400"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={convertToTask}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
                >
                  Преобразовать в задачу
                </button>
                <button
                  type="button"
                  onClick={() => togglePin(selected)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
                >
                  {selected.is_pinned ? 'Открепить' : 'Закрепить'}
                </button>
                <button
                  type="button"
                  onClick={deleteNote}
                  className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
                >
                  Удалить
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Выберите заметку для просмотра.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Notes;
