
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Property, Transaction, MaintenanceTask } from '@/shared/types';
import { COLORS } from '@/shared/ui/constants';
import { useTranslation } from '@/core/i18n/I18nContext';

interface DashboardProps {
  properties: Property[];
  transactions: Transaction[];
  tasks: MaintenanceTask[];
}

const Dashboard: React.FC<DashboardProps> = ({ properties, transactions, tasks }) => {
  const { t } = useTranslation();
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const chartData = [
    { name: 'Income', value: totalIncome, fill: COLORS.secondary },
    { name: 'Expenses', value: totalExpense, fill: COLORS.danger }
  ];

  const pendingTasksCount = tasks.filter(t => t.status !== 'Complete').length;

  return (
    <div className="space-y-8 animate-fadeIn bg-white">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('dashboard.title')}</h2>
          <p className="text-slate-400 font-medium">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button className="px-4 py-2 text-xs font-bold bg-[#87a3a3] text-white rounded-lg shadow-md transition-all">{t('dashboard.yearly')}</button>
          <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">{t('dashboard.monthly')}</button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('dashboard.net_revenue')}</p>
          <p className={`text-3xl font-black mt-1 ${balance >= 0 ? 'text-slate-500' : 'text-rose-400'}`}>
            ${balance.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('dashboard.active_units')}</p>
          <p className="text-3xl font-black mt-1 text-slate-500">{properties.length}</p>
          <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-tighter">{properties.filter(p => p.status === 'Occupied').length} {t('dashboard.occupied')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('dashboard.maint_opex')}</p>
          <p className="text-3xl font-black mt-1 text-rose-400">${totalExpense.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-tighter">{t('dashboard.ytd_spending')}</p>
        </div>

        <div className="bg-[#87a3a3] p-6 rounded-3xl shadow-lg border border-[#6b8686] hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{t('dashboard.active_jobs')}</p>
          <p className="text-3xl font-black mt-1 text-white">{pendingTasksCount}</p>
          <p className="text-[10px] font-bold text-white/50 mt-2 uppercase tracking-tighter">{t('dashboard.action_required').replace('{count}', tasks.filter(t => t.priority === 'High').length.toString())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-500 tracking-tight">{t('dashboard.financial_pulse')}</h3>
            <button className="text-sm font-bold text-[#87a3a3] hover:underline">{t('dashboard.full_report')}</button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                  dy={15} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    padding: '12px 16px'
                  }} 
                />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-500 tracking-tight mb-8">{t('dashboard.service_queue')}</h3>
          <div className="space-y-5">
            {tasks.filter(t => t.status !== 'Complete').slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-4 group cursor-pointer">
                <div className={`w-1.5 h-12 rounded-full flex-shrink-0 transition-all group-hover:h-14 ${
                  task.priority === 'High' ? 'bg-rose-400' : task.priority === 'Medium' ? 'bg-amber-400' : 'bg-slate-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-500 truncate group-hover:text-[#87a3a3] transition-colors">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{task.status}</span>
                    <span className="w-1 h-1 bg-slate-100 rounded-full" />
                    <span className="text-[10px] font-bold text-[#87a3a3]">{task.dueDate}</span>
                  </div>
                </div>
                <div className="text-slate-200 group-hover:text-[#87a3a3] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'Complete').length === 0 && (
              <div className="py-20 text-center">
                <p className="text-sm text-slate-300 font-bold italic">{t('dashboard.queue_cleared')}</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-4 text-[#87a3a3] font-black text-xs uppercase tracking-widest bg-white rounded-2xl hover:bg-[#87a3a315] transition-all border border-slate-100">
            {t('dashboard.view_operations')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
