
import React, { useState, useEffect, useCallback } from 'react';
import { View, Property, Transaction, MaintenanceTask, Invoice, Quote, RecurringInvoice, Payment, Branch, Lease } from '@/shared/types';
import { JurisdictionConfig } from '@/core/jurisdiction/JurisdictionManager';
import { Icons, Logo } from '@/shared/ui/constants';
import { DatabaseErrorView } from '@/shared/ui/DatabaseErrorView';
import Dashboard from '@/modules/dashboard/Dashboard';
import Accounting from '@/modules/accounting/Accounting';
import Maintenance from '@/modules/maintenance/Maintenance';
import Billing from '@/modules/billing/Billing';
import Properties from '@/modules/properties/Properties';
import Leases from '@/modules/leases/Leases';
import SystemStatus from '@/modules/status/SystemStatus';
import Members from '@/modules/members/Members';
import Settings from '@/modules/settings/Settings';
import Changelog from '@/modules/changelog/Changelog';
import ProtectedContent from '@/shared/ui/ProtectedContent';
import AuthView from '@/core/auth/AuthView';
import { useAuth } from '@/core/auth/AuthContext';
import { useTranslation } from '@/core/i18n/I18nContext';
import { USER_ROLES } from '@/core/auth/roles';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiKeyMissing] = useState(false);
  const { user, logout, activeOrganization, activeRole, organizations, switchOrganization, activeBranchId, switchBranch } = useAuth();
  const { t } = useTranslation();

  // Scoped Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [jurisdictionConfig, setJurisdictionConfig] = useState<JurisdictionConfig | null>(null);
  const [dbError, setDbError] = useState<{ message: string; code?: string; diagnostics?: { host?: string; port?: string; database?: string; user?: string; hasSsl?: boolean; error?: string } | null } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    const safeFetch = async (url: string, options?: RequestInit) => {
      try {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) {
            // Include diagnostics if available in the error response
            const error = new Error(data.error || data.message || `API Error: ${res.status} ${res.statusText}`) as Error & { diagnostics?: Record<string, unknown> };
            error.diagnostics = data.diagnostics;
            throw error;
          }
          return data;
        }
        const text = await res.text();
        throw new Error(`Endpoint ${url} returned ${contentType || 'unknown'} instead of JSON. Body snippet: ${text.slice(0, 100)}...`);
      } catch (err: unknown) {
        const error = err as Error & { diagnostics?: Record<string, unknown> };
        if (error.message.includes('Expected JSON') || error.message.includes('instead of JSON')) {
           throw error;
        }
        throw error;
      }
    };

    try {
      const healthRes = await safeFetch('/api/health');
      if (healthRes.status === 'error') {
        setDbError({ 
          message: healthRes.message, 
          code: healthRes.code,
          diagnostics: healthRes.diagnostics 
        });
        return;
      }
      setDbError(null);

      const headers = {
        'x-org-id': activeOrganization?.id || '',
        'x-branch-id': activeBranchId || '',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const [
        propsRes, transRes, tasksRes, invRes, quotesRes, 
        recInvRes, payRes, leasesRes, branchesRes, jurRes
      ] = await Promise.all([
        safeFetch('/api/properties', { headers }),
        safeFetch('/api/transactions', { headers }),
        safeFetch('/api/tasks', { headers }),
        safeFetch('/api/invoices', { headers }),
        safeFetch('/api/quotes', { headers }),
        safeFetch('/api/recurring-invoices', { headers }),
        safeFetch('/api/payments', { headers }),
        safeFetch('/api/leases', { headers }),
        safeFetch('/api/branches', { headers }),
        safeFetch('/api/jurisdiction-config', { headers })
      ]);

      setProperties(propsRes);
      setTransactions(transRes);
      setTasks(tasksRes);
      setInvoices(invRes);
      setQuotes(quotesRes);
      setRecurringInvoices(recInvRes);
      setPayments(payRes);
      setLeases(leasesRes);
      setBranches(branchesRes);
      setJurisdictionConfig(jurRes);
    } catch (err: unknown) {
      const error = err as Error & { diagnostics?: Record<string, unknown> };
      console.error('Data Fetch Failure:', error);
      // Capture any API-related error to show in the error view
      setDbError({ 
        message: error.message,
        code: 'FETCH_ERROR',
        diagnostics: error.diagnostics as { host?: string; port?: string; database?: string; user?: string; hasSsl?: boolean; error?: string } | null
      });
    }
  }, [user, activeBranchId, activeOrganization?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Check for API key presence safely in browser
    // Note: process.env is handled by Vite define or is undefined in browser
    const proc = (window as any).process; // eslint-disable-line @typescript-eslint/no-explicit-any
    const meta = (import.meta as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const apiKey = proc?.env?.GEMINI_API_KEY || meta.env?.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      // Use a subtle check or skip if not critical
    }
  }, []);

  if (dbError) {
    return (
      <DatabaseErrorView 
        message={dbError.message} 
        code={dbError.code} 
        diagnostics={dbError.diagnostics}
        onRetry={() => fetchData()} 
      />
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6 font-sans animate-fadeIn">
        <div className="w-full max-w-md bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
          <Logo size="lg" />
          <h2 className="mt-6 text-2xl font-bold text-slate-800 tracking-tight">Create your organization</h2>
          <p className="mt-2 text-slate-400 text-sm font-medium">To get started, please set up your first organization.</p>
          <form 
            onSubmit={async (e) => {
               e.preventDefault();
               const form = e.target as HTMLFormElement;
               const name = (form.elements.namedItem('orgName') as HTMLInputElement).value;
               try {
                 const res = await fetch('/api/organizations', {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json',
                     // Need token from localStorage as it might not be in the hook cleanly, well we can just get it.
                     'Authorization': `Bearer ${localStorage.getItem('token')}` 
                   },
                   body: JSON.stringify({ name })
                 });
                 if (!res.ok) {
                   const data = await res.json();
                   throw new Error(data.message || data.error || 'Failed to create organization');
                 }
                 window.location.reload(); // Quick way to reload AuthContext and data
               } catch (err: unknown) {
                 alert('Failed to create organization: ' + (err instanceof Error ? err.message : String(err)));
               }
            }} 
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="orgName" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 px-1">Organization Name</label>
              <input id="orgName" name="orgName" required type="text" placeholder="Acme Corp" className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]" />
            </div>
            <button type="submit" className="w-full px-6 py-4 bg-[#87a3a3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#87a3a330] hover:bg-[#769191] transition-all">
              Create Organization
            </button>
          </form>
          <div className="mt-6 text-center">
             <button onClick={logout} className="text-xs text-slate-400 font-bold hover:text-slate-600">Switch account</button>
          </div>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: View.Dashboard, label: t('sidebar.dashboard'), icon: <Icons.Dashboard /> },
    { id: View.Properties, label: t('sidebar.properties'), icon: <Icons.Properties /> },
    { id: View.Leases, label: t('sidebar.leases'), icon: <Icons.Leases /> },
    { id: View.Accounting, label: t('sidebar.accounting'), icon: <Icons.Accounting /> },
    { id: View.Maintenance, label: t('sidebar.maintenance'), icon: <Icons.Maintenance /> },
    { id: View.Billing, label: t('sidebar.billing'), icon: <Icons.Billing /> },
    { id: View.Status, label: t('sidebar.status'), icon: <Icons.Status />, roles: [USER_ROLES.Admin, USER_ROLES.Staff] },
    { id: View.Members, label: t('sidebar.members') || 'Members', icon: <Icons.Members />, roles: [USER_ROLES.Admin] },
    { id: View.Settings, label: t('sidebar.settings'), icon: <Icons.Settings /> },
    { id: View.Changelog, label: t('sidebar.changelog') || 'Changelog', icon: <Icons.Changelog />, roles: [USER_ROLES.Admin] },
  ];

  const renderContent = () => {
    switch (currentView) {
      case View.Dashboard:
        return <Dashboard properties={properties} transactions={transactions} tasks={tasks} />;
      case View.Properties:
        return <Properties properties={properties} setProperties={setProperties} />;
      case View.Leases:
        return <Leases leases={leases} setLeases={setLeases} properties={properties} />;
      case View.Accounting:
        return <Accounting transactions={transactions} setTransactions={setTransactions} properties={properties} />;
      case View.Maintenance:
        return <Maintenance tasks={tasks} setTasks={setTasks} properties={properties} />;
      case View.Billing:
        return (
          <Billing 
            invoices={invoices} 
            setInvoices={setInvoices} 
            quotes={quotes}
            recurringInvoices={recurringInvoices}
            payments={payments}
            properties={properties} 
          />
        );
      case View.Status:
        return <ProtectedContent roles={[USER_ROLES.Admin, USER_ROLES.Staff]}><SystemStatus /></ProtectedContent>;
      case View.Members:
        return <ProtectedContent roles={[USER_ROLES.Admin]}><Members /></ProtectedContent>;
      case View.Settings:
        return <Settings />;
      case View.Changelog:
        return <ProtectedContent roles={[USER_ROLES.Admin]}><Changelog /></ProtectedContent>;
      default:
        return <Dashboard properties={properties} transactions={transactions} tasks={tasks} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white relative">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsMobileMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <aside className={`
        w-72 bg-white text-slate-500 flex-shrink-0 flex flex-col border-r border-slate-100 z-50
        transition-transform duration-300 ease-in-out
        fixed md:sticky top-0 h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex items-center gap-4">
          <Logo size="sm" />
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight text-slate-800">LOT 202</h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t('sidebar.dashboard') === 'Dashboard' ? 'Management' : 'Gestión'}</p>
          </div>
        </div>

        {organizations.length > 0 && (
          <div className="px-8 space-y-4 mb-6">
            <div>
              <label htmlFor="org-switcher" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">{t('app.active_org')}</label>
              <select 
                id="org-switcher"
                value={activeOrganization?.id || ''} 
                onChange={(e) => switchOrganization(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            {branches.length > 0 && (
              <div>
                <label htmlFor="branch-switcher" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center justify-between">
                  {t('app.active_branch')}
                  <span className="text-[8px] bg-[#87a3a320] text-[#87a3a3] px-1.5 rounded uppercase">{t('app.scoped')}</span>
                </label>
                <select 
                  id="branch-switcher"
                  value={activeBranchId || ''} 
                  onChange={(e) => switchBranch(e.target.value || null)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]"
                >
                  <option value="">{t('app.all_branches')}</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
                {activeBranchId && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">{t('app.rent_control')}</span>
                      <span className={jurisdictionConfig?.isRentControlEnabled ? 'text-green-500 font-black' : 'text-slate-300 font-black'}>
                        {jurisdictionConfig?.isRentControlEnabled ? t('app.enabled') : t('app.disabled')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">{t('app.inspection')}</span>
                      <span className={jurisdictionConfig?.mandatoryInspection ? 'text-[#87a3a3] font-black' : 'text-slate-300 font-black'}>
                        {jurisdictionConfig?.mandatoryInspection ? t('app.mandatory') : t('app.optional')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <nav className="mt-4 flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => {
             const content = (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-slate-50 text-[#87a3a3] shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <div className={currentView === item.id ? 'scale-110 transition-transform text-[#87a3a3]' : 'text-slate-400'}>
                  {item.icon}
                </div>
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );

            return item.roles ? <ProtectedContent key={item.id} roles={item.roles}>{content}</ProtectedContent> : content;
          })}
        </nav>
        <div className="p-8 border-t border-slate-100">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-10 h-10 rounded-full bg-[#87a3a3] text-white flex-shrink-0 flex items-center justify-center font-black shadow-sm">{user?.firstName?.charAt(0) || '?'}</div>
               <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                 <p className="text-[10px] text-slate-400 font-bold tracking-tight">{activeRole || t('app.no_role')}</p>
               </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title={t('app.logout')}
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-white">
        {apiKeyMissing && (
          <div className="bg-red-100 border-b-2 border-red-500 text-red-700 text-center p-3 font-semibold text-sm sticky top-0 z-30">
            {t('app.api_key_warning')}
          </div>
        )}
        <header className="md:hidden p-4 bg-[#87a3a3] text-white flex justify-between items-center sticky top-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <h1 className="text-lg font-black uppercase">Lot 202</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={logout}
               className="p-2 bg-[#ffffff20] rounded-lg"
            >
              <Icons.Logout />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-[#ffffff20] rounded-lg text-white"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
