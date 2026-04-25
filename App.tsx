
import React, { useState, useEffect, useMemo } from 'react';
import { View } from '@/shared/types';
import { Icons, Logo } from '@/shared/ui/constants';
import { createRepository } from '@/core/db/repository';
import { JurisdictionManager } from '@/core/jurisdiction/JurisdictionManager';
import Dashboard from '@/modules/dashboard/Dashboard';
import Accounting from '@/modules/accounting/Accounting';
import Maintenance from '@/modules/maintenance/Maintenance';
import Billing from '@/modules/billing/Billing';
import Properties from '@/modules/properties/Properties';
import Leases from '@/modules/leases/Leases';
import SystemStatus from '@/modules/status/SystemStatus';
import Settings from '@/modules/settings/Settings';
import ProtectedContent from '@/shared/ui/ProtectedContent';
import AuthView from '@/core/auth/AuthView';
import { useAuth } from '@/core/auth/AuthContext';
import { useTranslation } from '@/core/i18n/I18nContext';
import { USER_ROLES } from '@/core/auth/roles';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const { user, logout, activeOrganization, activeRole, organizations, switchOrganization, activeBranchId, switchBranch } = useAuth();
  const { t } = useTranslation();

  // Scoped Repository instance
  const repo = useMemo(() => createRepository(activeOrganization?.id || null, activeBranchId), [activeOrganization, activeBranchId]);

  // Scoped Data State
  const [properties, setProperties] = useState(() => repo.getProperties());
  const [transactions, setTransactions] = useState(() => repo.getTransactions());
  const [tasks, setTasks] = useState(() => repo.getTasks());
  const [invoices, setInvoices] = useState(() => repo.getInvoices());
  const [quotes, setQuotes] = useState(() => repo.getQuotes());
  const [recurringInvoices, setRecurringInvoices] = useState(() => repo.getRecurringInvoices());
  const [payments, setPayments] = useState(() => repo.getPayments());
  const [leases, setLeases] = useState(() => repo.getLeases());

  const branches = useMemo(() => repo.getBranches(), [repo]);

  // Jurisdiction Strategy Logic
  const jurisdictionConfig = useMemo(() => {
    const jur = repo.getJurisdictionForActiveBranch();
    return JurisdictionManager.getConfig(jur);
  }, [repo]);

  useEffect(() => {
    // Re-fetch data when scope changes
    setProperties(repo.getProperties());
    setTransactions(repo.getTransactions());
    setTasks(repo.getTasks());
    setInvoices(repo.getInvoices());
    setQuotes(repo.getQuotes());
    setRecurringInvoices(repo.getRecurringInvoices());
    setPayments(repo.getPayments());
    setLeases(repo.getLeases());
  }, [repo]);

  useEffect(() => {
    // Basic validation for the API key's presence
    if (!process.env.GEMINI_API_KEY || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length < 10)) {
      setApiKeyMissing(true);
    }
  }, []);

  if (!user) {
    return <AuthView />;
  }

  const sidebarItems = [
    { id: View.Dashboard, label: t('sidebar.dashboard'), icon: <Icons.Dashboard /> },
    { id: View.Properties, label: t('sidebar.properties'), icon: <Icons.Properties /> },
    { id: View.Leases, label: t('sidebar.leases'), icon: <Icons.Leases /> },
    { id: View.Accounting, label: t('sidebar.accounting'), icon: <Icons.Accounting /> },
    { id: View.Maintenance, label: t('sidebar.maintenance'), icon: <Icons.Maintenance /> },
    { id: View.Billing, label: t('sidebar.billing'), icon: <Icons.Billing /> },
    { id: View.Status, label: t('sidebar.status'), icon: <Icons.Status />, roles: [USER_ROLES.Admin, USER_ROLES.Staff] },
    { id: View.Settings, label: t('sidebar.settings'), icon: <Icons.Settings /> },
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
      case View.Settings:
        return <Settings />;
      default:
        return <Dashboard properties={properties} transactions={transactions} tasks={tasks} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-72 bg-white text-slate-500 flex-shrink-0 flex flex-col hidden md:flex border-r border-slate-100">
        <div className="p-8 flex items-center gap-4">
          <Logo size="sm" />
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight text-slate-800">LOT 202</h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Management</p>
          </div>
        </div>

        {organizations.length > 0 && (
          <div className="px-8 space-y-4 mb-6">
            <div>
              <label htmlFor="org-switcher" className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Active Organization</label>
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
                  Active Branch
                  <span className="text-[8px] bg-[#87a3a320] text-[#87a3a3] px-1.5 rounded uppercase">Scoped</span>
                </label>
                <select 
                  id="branch-switcher"
                  value={activeBranchId || ''} 
                  onChange={(e) => switchBranch(e.target.value || null)}
                  className="w-full bg-slate-50 border border-slate-100 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87a3a350]"
                >
                  <option value="">All Branches</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
                {activeBranchId && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Rent Control</span>
                      <span className={jurisdictionConfig.isRentControlEnabled ? 'text-green-500 font-black' : 'text-slate-300 font-black'}>
                        {jurisdictionConfig.isRentControlEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Inspection</span>
                      <span className={jurisdictionConfig.mandatoryInspection ? 'text-[#87a3a3] font-black' : 'text-slate-300 font-black'}>
                        {jurisdictionConfig.mandatoryInspection ? 'MANDATORY' : 'OPTIONAL'}
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
                onClick={() => setCurrentView(item.id)}
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
                 <p className="text-[10px] text-slate-400 font-bold tracking-tight">{activeRole || 'No Role'}</p>
               </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-white">
        {apiKeyMissing && (
          <div className="bg-red-100 border-b-2 border-red-500 text-red-700 text-center p-3 font-semibold text-sm sticky top-0 z-30">
            Warning: Your Gemini API Key is missing or invalid. AI features will not work.
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
            <button className="p-2 bg-[#ffffff20] rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
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
