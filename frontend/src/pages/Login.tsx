import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showEmployeeHelp, setShowEmployeeHelp] = useState(false);
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error ?? 'Неверный email или пароль');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerData.fullName || !registerData.email || !registerData.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (registerData.password.length < 10) {
      setError('Пароль должен быть не короче 10 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(
        registerData.fullName,
        registerData.email,
        registerData.password,
        'client'
      );

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error ?? 'Не удалось зарегистрироваться');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <h1 className="text-4xl font-bold mb-2 text-[var(--ink)]">Док-План</h1>
          <p className="text-[var(--muted)]">Система планирования судоремонта</p>
        </div>

        <div className="rounded-xl p-8 border bg-[rgba(255,255,255,0.97)] border-[var(--line)] shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold mb-6 text-center text-[var(--ink)]">
            {isRegistering ? 'Регистрация' : 'Вход в систему'}
          </h2>

          {error && (
            <div className="px-4 py-3 rounded-lg mb-4 text-sm border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">
              {error}
            </div>
          )}

          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Пароль</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                    aria-label={showLoginPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[var(--blue)] hover:bg-[var(--blue-strong)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Вход...' : 'Войти'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">ФИО</label>
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  placeholder="Иванов И.И."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                  placeholder="user@example.com"
                />
              </div>

              <p className="text-xs text-[var(--muted)]">
                При самостоятельной регистрации создается учетная запись клиента.
              </p>

              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Пароль</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-11 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                    placeholder="Минимум 10 символов"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                    aria-label={showRegisterPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted)] mb-1">Подтверждение пароля</label>
                <div className="relative">
                  <input
                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-11 border rounded-lg bg-white text-[var(--ink)] border-[var(--line)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                    aria-label={showRegisterConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[var(--blue)] hover:bg-[var(--blue-strong)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[var(--muted)] hover:text-[var(--ink)] text-sm transition-colors"
            >
              {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>

          {!isRegistering && (
            <>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowEmployeeHelp((prev) => !prev)}
                  className="text-[var(--muted)] hover:text-[var(--ink)] text-sm transition-colors"
                >
                  Я сотрудник
                </button>
              </div>

              {showEmployeeHelp && (
                <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm text-[var(--muted)]">
                  Доступ сотрудникам выдает администратор. Напишите: <span className="font-medium text-[var(--ink)]">admin@shipyard.com</span>
                </div>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--line)]">
            <p className="text-xs text-[var(--muted)] mb-3 text-center">Быстрый вход в тестовые роли:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  quickLogin('admin@shipyard.com', 'operator12345');
                }}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Админ (управление)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('operator1@shipyard.com', 'operator12345')}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Оператор (док)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('dispatcher@shipyard.com', 'operator12345')}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Диспетчер
              </button>
              <button
                type="button"
                onClick={() => quickLogin('master1@shipyard.com', 'operator12345')}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Мастер
              </button>
              <button
                type="button"
                onClick={() => quickLogin('worker1@shipyard.com', 'operator12345')}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Рабочий
              </button>
              <button
                type="button"
                onClick={() => {
                  quickLogin('client1@shipyard.com', 'operator12345');
                }}
                className="px-2 py-2 text-xs border border-[var(--line-strong)] bg-white hover:bg-[var(--soft)] text-[var(--ink)] rounded transition-colors"
              >
                Клиент
              </button>
            </div>
            <p className="text-[11px] text-[var(--muted)] mt-3 text-center">
              Отображаются только подтвержденные тестовые учетные записи.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
