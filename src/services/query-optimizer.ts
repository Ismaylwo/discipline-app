import { supabase } from './supabase';

export class QueryOptimizer {
  // Кэширование запросов в LocalStorage
  static cacheQuery<T>(key: string, queryFn: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const cached = localStorage.getItem(key);
    const now = Date.now();

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (now - timestamp < ttl) {
        return Promise.resolve(data);
      }
    }

    return queryFn().then((data) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: now
        })
      );
      return data;
    });
  }

  // Пакетная загрузка данных
  static async batchLoadTasks(userId: string) {
    const queries: Promise<any>[] = [];

    queries.push(
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(100) as any
    );

    const today = new Date().toISOString().split('T')[0];
    queries.push(
      supabase
        .from('tasks')
        .select(
          `
          *,
          habit_logs!inner (
            completed
          )
        `
        )
        .eq('user_id', userId)
        .eq('type', 'habit')
        .eq('habit_logs.date', today) as any
    );

    queries.push(
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('deadline', { ascending: true })
        .limit(5) as any
    );

    const results = await Promise.all(queries);
    return {
      tasks: results[0].data || [],
      habits: results[1].data || [],
      projects: results[2].data || []
    };
  }
}
