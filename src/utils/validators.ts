export class DataValidator {
  static validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Пароль должен содержать минимум 8 символов.');
    }
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Пароль должен содержать буквы.');
    }
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать цифры.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  static validateTaskData(task: any): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!task.title || task.title.trim().length === 0) {
      errors.title = 'Название задачи обязательно.';
    }

    if (task.title && task.title.length > 200) {
      errors.title = 'Название не должно превышать 200 символов.';
    }

    if (task.description && task.description.length > 2000) {
      errors.description = 'Описание не должно превышать 2000 символов.';
    }

    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      if (Number.isNaN(dueDate.getTime())) {
        errors.due_date = 'Некорректная дата.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
