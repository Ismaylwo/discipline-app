import { supabase } from './supabase';
import { Tables } from '../types/database.types';

type TaskRow = Tables<'tasks'>;

type RecurrenceRule = {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
};

export class TaskRulesService {
  static async createNextRecurringTask(completedTask: TaskRow) {
    if (!completedTask.recurrence) return;

    const recurrence = completedTask.recurrence as RecurrenceRule;

    const baseDate = completedTask.due_date ? new Date(completedTask.due_date) : new Date();
    const nextDate = this.calculateNextDate(baseDate, recurrence);

    if (recurrence.endDate && new Date(nextDate) > new Date(recurrence.endDate)) {
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: completedTask.user_id,
      title: completedTask.title,
      description: completedTask.description,
      type: completedTask.type,
      priority: completedTask.priority,
      category_id: completedTask.category_id,
      due_date: nextDate.toISOString(),
      recurrence: completedTask.recurrence,
      project_id: completedTask.project_id
    });

    if (error) {
      console.error('Ошибка создания повторяющейся задачи:', error);
    }
  }

  private static calculateNextDate(currentDate: Date, recurrence: RecurrenceRule): Date {
    const nextDate = new Date(currentDate);

    switch (recurrence.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
        break;
      case 'weekly':
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          let daysToAdd = 1;
          while (daysToAdd <= 7) {
            nextDate.setDate(nextDate.getDate() + 1);
            const dayOfWeek = nextDate.getDay();
            if (recurrence.daysOfWeek.includes(dayOfWeek)) {
              break;
            }
            daysToAdd += 1;
          }
        } else {
          nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
        }
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        break;
    }

    return nextDate;
  }

  // Автоматическое повышение приоритета при приближении дедлайна
  static async updateTaskPriorityBasedOnDeadline() {
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { error } = await supabase
      .from('tasks')
      .update({ priority: 'high' })
      .eq('completed', false)
      .eq('priority', 'medium')
      .lte('due_date', twoDaysFromNow.toISOString())
      .gte('due_date', now.toISOString());

    if (error) {
      console.error('Ошибка обновления приоритетов:', error);
    }
  }
}
