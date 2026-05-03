
import React from 'react';

interface DatabaseErrorViewProps {
  message: string;
  code?: string;
  diagnostics?: {
    host?: string;
    port?: string;
    database?: string;
    user?: string;
    hasSsl?: boolean;
    error?: string;
  } | null;
  onRetry: () => void;
}

export const DatabaseErrorView: React.FC<DatabaseErrorViewProps> = ({ message, code, diagnostics, onRetry }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 text-slate-800 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 text-center overflow-hidden relative">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500/10" />
        
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
          Database Connection Failed
        </h1>
        
        <p className="text-slate-500 mb-8 font-medium leading-relaxed max-w-md mx-auto">
          The application server is alive, but it cannot connect to the <strong>PostgreSQL</strong> database with the provided credentials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Connection Details</p>
            <div className="space-y-2 text-xs font-bold font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-tighter">Host</span>
                <span className="text-slate-700 truncate max-w-[120px]">{diagnostics?.host || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-tighter">Port</span>
                <span className="text-slate-700">{diagnostics?.port || '5432'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-tighter">DB Name</span>
                <span className="text-slate-700 truncate max-w-[120px]">{diagnostics?.database || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-tighter">User</span>
                <span className="text-slate-700 truncate max-w-[120px]">{diagnostics?.user || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-400 uppercase tracking-tighter">SSL Status</span>
                <span className={diagnostics?.hasSsl ? 'text-[#87a3a3]' : 'text-orange-400'}>
                  {diagnostics?.hasSsl ? 'Active (Recommended)' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-left font-mono text-[11px] shadow-inner flex flex-col justify-between overflow-hidden">
             <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400/40"></div>
                  <div className="w-2 h-2 rounded-full bg-orange-400/40"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400/40"></div>
                </div>
                <span className="text-slate-600 font-bold uppercase tracking-[0.1em] text-[9px] ml-1">Live Logs</span>
              </div>
              <div className="text-red-400/90 break-words leading-tight animate-in fade-in slide-in-from-top-1 duration-500">
                {message || 'Unknown protocol error occurred during handshake.'}
              </div>
            </div>
            {code && (
              <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 items-center">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Code</span>
                <span className="text-orange-300 font-black tracking-wider uppercase">{code}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onRetry}
            className="group relative w-full py-5 bg-[#87a3a3] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#6b8585] transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-xl shadow-[#87a3a3]/30 cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Attempt Reconnection
            </span>
          </button>
          
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-px bg-slate-100 flex-1"></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              Lot 202 Operations
            </p>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
