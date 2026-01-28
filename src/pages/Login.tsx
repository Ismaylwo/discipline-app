import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div>
          <h1 className="text-3xl font-semibold">ДИСЦИПЛИНА</h1>
          <p className="mt-4 text-slate-400">
            Единое пространство для задач, привычек и проектов. Сфокусируйтесь на
            главном.
          </p>
        </div>
        <div className="space-y-4 text-sm text-slate-400">
          <p>• Быстрые задачи и привычки в одном месте</p>
          <p>• Канбан-доски и заметки для проектов</p>
          <p>• Аналитика, которая показывает прогресс</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Вход в аккаунт</h2>
            <p className="text-sm text-slate-400">
              Используйте email и пароль, чтобы продолжить.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
