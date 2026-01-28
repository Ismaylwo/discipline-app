import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DataValidator } from '../../utils/validators';

const LoginForm: React.FC = () => {
  const { signIn, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!DataValidator.validateEmail(email)) {
      setError('Введите корректный email.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);

      if (rememberMe) {
        localStorage.setItem('discipline_remember_me', 'true');
      } else {
        localStorage.removeItem('discipline_remember_me');
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Введите email для восстановления пароля.');
      return;
    }

    try {
      await requestPasswordReset(email);
      alert('Письмо для сброса пароля отправлено.');
    } catch (err: any) {
      setError(err?.message || 'Не удалось отправить письмо.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-200">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-primary-500 focus:ring-primary-400"
          />
          Запомнить меня
        </label>
        <button
          type="button"
          onClick={handlePasswordReset}
          className="text-primary-300 hover:text-primary-200"
        >
          Забыли пароль?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary-500 py-2 text-sm font-semibold text-white transition hover:bg-primary-400 disabled:opacity-60"
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>

      <p className="text-center text-sm text-slate-400">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-primary-300 hover:text-primary-200">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
