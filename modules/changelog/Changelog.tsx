import React from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface ChangelogEntry {
  id: string;
  date: string;
  time: string;
  version?: string;
  author: string;
  changes: string[];
  type: 'feature' | 'fix' | 'refactor' | 'security';
}

// Future changes can be added here easily.
const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    id: '8',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    version: '1.4.0',
    author: 'Admin',
    type: 'feature',
    changes: [
      'Cleared existing database data and established sole system administrator account.',
      'Removed public user registration and auto-creation endpoints to secure access.',
      'Added Members management view for Admins to create, edit, and assign roles to users.',
      'Added translations for the new Members page functionality.'
    ]
  },
  {
    id: '7',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    version: '1.3.0',
    author: 'Admin',
    type: 'security',
    changes: [
      'Implemented secure centralized Role-Based Access Control logic (rbacMiddleware)',
      'Added robust invite endpoints with expiration handling in backend',
      'Configured overlapping users for active org context switching',
      'Scoped data endpoints dynamically through branchScopingMiddleware via real db relationships'
    ]
  },
  {
    id: '6',
    date: '2026-04-28',
    time: '22:15',
    version: '1.2.0',
    author: 'Admin',
    type: 'feature',
    changes: [
      'Added Administrator Changelog view to track future updates',
    ]
  },
  {
    id: '5',
    date: '2026-04-28',
    time: '21:55',
    version: '1.1.2',
    author: 'Admin',
    type: 'fix',
    changes: [
      'Fixed Data Fetch Failure and Not Found errors in the API',
      'Added missing backend routes for /api/quotes, /api/recurring-invoices, and /api/payments'
    ]
  },
  {
    id: '4',
    date: '2026-04-28',
    time: '21:50',
    version: '1.1.1',
    author: 'Admin',
    type: 'refactor',
    changes: [
      'Configured Admin user with super administrative privileges across all organizations',
      'Enhanced AuthService to automatically grant Admin access globally for admin@lot202.com'
    ]
  },
  {
    id: '3',
    date: '2026-04-28',
    time: '21:45',
    version: '1.1.0',
    author: 'Admin',
    type: 'security',
    changes: [
      'Generated initial static credentials for admin access (admin@lot202.com)',
      'Added create-admin script setup'
    ]
  },
  {
    id: '2',
    date: '2026-04-28',
    time: '21:30',
    version: '1.0.1',
    author: 'Admin',
    type: 'feature',
    changes: [
      'Implemented role-based access control (RBAC)',
      'Added ProtectedContent component for UI components',
      'Configured System Status and Settings pages for Staff and Admin only'
    ]
  },
  {
    id: '1',
    date: '2026-04-28',
    time: '21:00',
    version: '1.0.0',
    author: 'Admin',
    type: 'feature',
    changes: [
      'Initial platform setup and deployment',
      'Integrated Drizzle ORM and Postgres database module',
      'Created multi-tenant schema with branches and jurisdictions'
    ]
  }
];

const getTypeColor = (type: ChangelogEntry['type']) => {
  switch (type) {
    case 'feature': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'fix': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'refactor': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'security': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const Changelog: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('changelog.title') || 'Changelog'}</h2>
        <p className="text-slate-400 font-medium">{t('changelog.subtitle') || 'System updates and modifications history.'}</p>
      </div>
      
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-10">
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          
          {CHANGELOG_DATA.map((entry) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#87a3a3] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              {/* Content Box */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-[#87a3a3]/30">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </span>
                    {entry.version && (
                      <span className="text-sm font-bold text-slate-700">v{entry.version}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {entry.date} {entry.time}
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {entry.changes.map((change, index) => (
                    <li key={index} className="flex gap-3 text-sm text-slate-600">
                      <span className="text-[#87a3a3] mt-0.5 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="leading-relaxed">{change}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200/60 text-xs text-slate-400 font-medium">
                  Logged by: {entry.author}
                </div>
              </div>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
};

export default Changelog;
