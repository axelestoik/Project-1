
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Logo } from '@/shared/ui/constants';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '@/core/i18n/I18nContext';

const AuthView: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);

  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tkn = params.get('token');
    if (tkn) {
      setToken(tkn);
      setView('register');
      validateToken(tkn);
    }
  }, []);

  const validateToken = async (tkn: string) => {
    try {
      let res = await fetch(`/api/invitations/validate/${tkn}`);
      if (!res.ok) {
        // Fallback to platform invite
        res = await fetch(`/api/platform/invitations/validate/${tkn}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Invitation is invalid or expired');
        }
      }
      const data = await res.json();
      setEmail(data.email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid invitation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        await login({ email, password });
      } else {
        let res = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email, password, firstName, lastName })
        });
        if (res.status === 404 || res.status === 400) {
           // Try platform registration as fallback if invitation not found or invalid
           const platformRes = await fetch('/api/platform/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, email, password, firstName, lastName })
           });
           if (platformRes.ok) { res = platformRes; }
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Registration failed');
        }
        // After registration, log in
        await login({ email, password });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-8 pb-4 flex flex-col items-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-bold text-slate-800 tracking-tight">
            {view === 'login' ? t('auth.welcome_back') : 'Complete Registration'}
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium text-center px-4">
            {view === 'login' ? t('auth.login_desc') : 'You have been invited to join the platform. Please set up your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          {view === 'register' && (
            <div className="flex gap-4">
              <div className="space-y-1.5 flex-1">
                <label htmlFor="firstName" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">First Name</label>
                <input
                  id="firstName"
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label htmlFor="lastName" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Last Name</label>
                <input
                  id="lastName"
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              required
              readOnly={!!token}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all ${token ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs font-bold"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#87a3a3] hover:bg-[#769191] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#87a3a330] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? t('auth.processing') : (view === 'login' ? t('auth.signin') : 'Join Organization')}
          </button>

          {view === 'login' && !token && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-medium">Looking to register? You need an invitation link.</p>
            </div>
          )}
        </form>
      </motion.div>

      <p className="mt-8 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
        {t('auth.footer')}
      </p>
    </div>
  );
};

export default AuthView;
