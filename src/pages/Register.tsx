import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DataValidator } from '../utils/validators';

const Register: React.FC = () => {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Введите имя пользователя.');
      return;
    }

    if (!DataValidator.validateEmail(email)) {
      setError('Введите корректный email.');
      return;
    }

    const passwordCheck = DataValidator.validatePassword(password);
    if (!passwordCheck.isValid) {
      setPasswordErrors(passwordCheck.errors);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ошибка регистрации.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Создать аккаунт</h1>
          <p className="text-sm text-slate-400">Бесплатно, быстро и удобно.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {passwordErrors.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {passwordErrors.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Имя пользователя</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-500 py-2 text-sm font-semibold text-white hover:bg-primary-400 disabled:opacity-60"
          >
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary-300 hover:text-primary-200">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
