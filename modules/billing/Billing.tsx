
import React, { useState } from 'react';
import { Invoice, Property, Quote, RecurringInvoice, Payment } from '@/shared/types';
import { useTranslation } from '@/core/i18n/I18nContext';

interface BillingProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  quotes: Quote[];
  recurringInvoices: RecurringInvoice[];
  payments: Payment[];
  properties: Property[];
}

type BillingSubView = 'quotes' | 'retainers' | 'invoices' | 'recurring' | 'payments';

const Billing: React.FC<BillingProps> = ({ 
  invoices, 
  setInvoices: _setInvoices, 
  quotes, 
  recurringInvoices, 
  payments, 
  properties 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<BillingSubView>('invoices');

  const tabs: { id: BillingSubView; label: string }[] = [
    { id: 'quotes', label: t('billing.tabs.quotes') },
    { id: 'retainers', label: t('billing.tabs.retainers') },
    { id: 'invoices', label: t('billing.tabs.invoices') },
    { id: 'recurring', label: t('billing.tabs.recurring') },
    { id: 'payments', label: t('billing.tabs.history') },
  ];

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'quotes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn bg-white">
            {quotes.map(quote => (
              <div key={quote.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    quote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-400'
                  }`}>
                    {quote.status}
                  </span>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t('billing.valid_til').replace('{date}', quote.expiryDate)}</p>
                </div>
                <h3 className="font-black text-slate-500 text-xl mb-1 group-hover:text-[#87a3a3] transition-colors">{quote.clientName}</h3>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-6">{properties.find(p => p.id === quote.propertyId)?.name}</p>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">{t('billing.proposal_total')}</span>
                    <span className="text-2xl font-black text-slate-500">${quote.amount.toLocaleString()}</span>
                  </div>
                  <button className="p-3 bg-white text-[#87a3a3] rounded-2xl hover:bg-[#87a3a3] hover:text-white transition-all shadow-sm border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'retainers':
        return (
          <div className="bg-white rounded-[40px] p-24 border-4 border-dashed border-slate-50 text-center animate-fadeIn">
            <div className="p-8 bg-slate-50 rounded-full w-fit mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-300 font-bold italic mb-6">{t('billing.secured_funds_ledger')}</p>
            <button className="px-8 py-4 bg-[#87a3a3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#87a3a320] hover:bg-[#6b8686] transition-all">{t('billing.initial_deposit')}</button>
          </div>
        );

      case 'invoices':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn bg-white">
            {invoices.map(invoice => (
              <div key={invoice.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-400'
                    }`}>
                      {invoice.status}
                    </span>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{invoice.date}</p>
                  </div>
                  <h3 className="font-black text-slate-500 text-xl mb-1 group-hover:text-[#87a3a3] transition-colors">{invoice.tenantName}</h3>
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-8">{properties.find(p => p.id === invoice.propertyId)?.name}</p>
                  
                  <div className="space-y-4 mb-8">
                    {invoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center">
                        <span className="text-slate-400 font-medium">{item.description}</span>
                        <span className="font-black text-slate-500">${item.price.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{t('billing.total_invoice')}</span>
                      <span className="text-2xl font-black text-[#87a3a3]">${invoice.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100">{t('billing.pdf')}</button>
                    <button className="flex-1 py-4 bg-[#87a3a3] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#87a3a320] hover:bg-[#6b8686] transition-all">{t('billing.settle')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'recurring':
        return (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.account')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.cycle')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.renewal')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.revenue')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.state')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recurringInvoices.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-500 group-hover:text-[#87a3a3] transition-colors">{rec.tenantName}</span>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-300 uppercase tracking-tighter">{rec.frequency}</td>
                      <td className="px-8 py-6 text-sm font-medium text-slate-400">{rec.nextDate}</td>
                      <td className="px-8 py-6 text-sm font-black text-[#87a3a3]">${rec.amount.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[9px] font-black uppercase rounded-lg">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.date_received')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.instrument')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('billing.txn_reference')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">{t('billing.settled_amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6 text-sm font-bold text-slate-300">{p.date}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase rounded-lg">{p.method}</span>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black font-mono text-slate-300 uppercase tracking-widest">{p.reference}</td>
                      <td className="px-8 py-6 text-sm font-black text-right text-emerald-500">${p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">{t('billing.title')}</h2>
          <p className="text-slate-400 font-medium">{t('billing.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-[#87a3a3] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#87a3a340] hover:bg-[#6b8686] transition-all">
            {t('billing.new_action')}
          </button>
        </div>
      </div>

      {/* Secondary Sub-Navigation */}
      <div className="flex bg-white rounded-[24px] p-2 border border-slate-100 w-full md:w-fit overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#87a3a3] text-white shadow-sm' 
                : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {renderActiveContent()}
      </div>
    </div>
  );
};

export default Billing;
