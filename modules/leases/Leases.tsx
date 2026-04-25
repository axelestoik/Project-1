
import React, { useState, useMemo } from 'react';
import { Lease, Property } from '@/shared/types';

interface LeasesProps {
  leases: Lease[];
  setLeases: React.Dispatch<React.SetStateAction<Lease[]>>;
  properties: Property[];
}

const Leases: React.FC<LeasesProps> = ({ leases, setLeases: _setLeases, properties }) => {
  const [filterStatus, setFilterStatus] = useState<Lease['status'] | 'All'>('All');

  const filteredLeases = useMemo(() => {
    if (filterStatus === 'All') return leases;
    return leases.filter(l => l.status === filterStatus);
  }, [leases, filterStatus]);

  const getStatusStyle = (status: Lease['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-500';
      case 'Expiring': return 'bg-amber-50 text-amber-500';
      case 'Terminated': return 'bg-rose-50 text-rose-400';
      case 'Pending': return 'bg-slate-50 text-slate-300';
      default: return 'bg-slate-50 text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">Legal Agreements</h2>
          <p className="text-slate-400 font-medium">Tenant contracts, occupancy terms, and active leases.</p>
        </div>
        <button className="px-8 py-4 bg-[#87a3a3] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#87a3a340] hover:bg-[#6b8686] transition-all">
          + Draft Lease
        </button>
      </div>

      <div className="flex gap-3 bg-white rounded-[24px] p-2 border border-slate-100 w-fit overflow-x-auto no-scrollbar">
        {['All', 'Active', 'Pending', 'Expiring', 'Terminated'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as Lease['status'] | 'All')}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl whitespace-nowrap ${
              filterStatus === status 
                ? 'bg-[#87a3a3] text-white shadow-sm' 
                : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Lessee</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Asset Location</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Contractual Term</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Monthly Commitment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeases.map(lease => (
                <tr key={lease.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-500 group-hover:text-[#87a3a3] transition-colors">{lease.tenantName}</div>
                    <div className="text-[9px] font-black text-slate-200 uppercase tracking-widest">ID: {lease.id}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-400">
                      {properties.find(p => p.id === lease.propertyId)?.name || 'Lot 202 Unit'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{lease.startDate} <span className="mx-2 text-slate-100">—</span> {lease.endDate}</div>
                  </td>
                  <td className="px-8 py-6 font-black text-[#87a3a3]">
                    ${lease.monthlyRent.toLocaleString()}<span className="text-[9px] uppercase tracking-widest text-slate-200 ml-1">/ mo</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getStatusStyle(lease.status)}`}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-200 hover:text-[#87a3a3] transition-colors border border-slate-100 px-4 py-2 rounded-xl hover:bg-slate-50">Legal Audit</button>
                  </td>
                </tr>
              ))}
              {filteredLeases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-200 font-bold italic">No contract matching the criteria &quot;{filterStatus}&quot; found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leases;
