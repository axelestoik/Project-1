
import React, { useState } from 'react';
import { Transaction, Property } from '@/shared/types';
import { analyzeAccounting } from '@/core/services/geminiService';
import { useTranslation } from '@/core/i18n/I18nContext';

interface AccountingProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  properties: Property[];
}

const Accounting: React.FC<AccountingProps> = ({ transactions, setTransactions: _setTransactions, properties }) => {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const correlationId = crypto.randomUUID();
    const dataString = JSON.stringify(transactions.map(t => ({ d: t.description, a: t.amount, ty: t.type })));
    const result = await analyzeAccounting(dataString, correlationId);
    setAnalysis(result || t('accounting.analysis_not_available'));
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-500 tracking-tight">{t('accounting.title')}</h2>
          <p className="text-slate-400 font-medium">{t('accounting.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-5 py-3 bg-[#87a3a315] text-[#87a3a3] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#87a3a325] transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <span className="animate-pulse">{t('accounting.consulting_ai')}</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('accounting.ai_audit')}
              </>
            )}
          </button>
          <button className="px-6 py-3 bg-[#87a3a3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#87a3a340] hover:bg-[#6b8686] hover:translate-y-[-2px] active:translate-y-0 transition-all">
            {t('accounting.log_entry')}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-[#87a3a3] text-white p-8 rounded-[32px] relative overflow-hidden shadow-xl animate-scaleIn">
          <div className="absolute top-0 right-0 p-12 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <button onClick={() => setAnalysis(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="font-black text-lg mb-4 flex items-center gap-3">
            {t('accounting.intelligence_report')}
          </h3>
          <p className="text-white/90 leading-relaxed font-medium italic">&quot;{analysis}&quot;</p>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('accounting.date')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('accounting.asset')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('accounting.descriptor')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('accounting.categorization')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">{t('accounting.valuation')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6 text-sm font-bold text-slate-300">{t.date}</td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-500 group-hover:text-[#87a3a3] transition-colors">
                      {properties.find(p => p.id === t.propertyId)?.name || 'Lot 202 General'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-400">{t.description}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-400'
                    }`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-8 py-6 text-sm font-black text-right ${
                    t.type === 'Income' ? 'text-emerald-600' : 'text-rose-400'
                  }`}>
                    {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
