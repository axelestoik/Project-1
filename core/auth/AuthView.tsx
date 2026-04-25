
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Logo } from '@/shared/ui/constants';
import { motion, AnimatePresence } from 'motion/react';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationId, setOrganizationId] = useState('org-01'); // Defaulting for simple demo
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, firstName, lastName, organizationId });
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
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium">
            {isLogin ? 'Enter your credentials to manage your properties' : 'Join Lot 202 Property Management'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
                    placeholder="Doe"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Password</label>
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

          {!isLogin && (
             <div className="space-y-1.5">
             <label htmlFor="organizationId" className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-1">Organization ID</label>
             <input
               id="organizationId"
               type="text"
               required
               value={organizationId}
               onChange={(e) => setOrganizationId(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350] transition-all"
               placeholder="org-01"
             />
             <p className="text-[9px] text-slate-400 px-1 italic">Use &apos;org-01&apos; or &apos;org-02&apos; for the demo</p>
           </div>
          )}

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
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[#87a3a3] font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>

      <p className="mt-8 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
        Enterprise-Grade Property Management
      </p>
    </div>
  );
};

export default AuthView;
