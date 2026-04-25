
import React from 'react';
import { Property } from '@/shared/types';

interface PropertiesProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const Properties: React.FC<PropertiesProps> = ({ properties, setProperties: _setProperties }) => {
  return (
    <div className="space-y-8 animate-fadeIn bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">Asset Portfolio</h2>
          <p className="text-slate-400 font-medium">Global management of real estate inventory.</p>
        </div>
        <button className="px-8 py-4 bg-[#87a3a3] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#87a3a340] hover:bg-[#6b8686] transition-all">
          + Onboard Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {properties.map(p => (
          <div key={p.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="h-56 bg-slate-50 relative overflow-hidden">
               <img 
                src={`https://picsum.photos/seed/${p.id}/800/600`} 
                alt={p.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 right-6">
                <span className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md ${
                  p.status === 'Occupied' ? 'bg-emerald-500/90 text-white' : 
                  p.status === 'Maintenance' ? 'bg-amber-500/90 text-white' : 'bg-[#87a3a3]/90 text-white'
                }`}>
                  {p.status}
                </span>
              </div>
              <div className="absolute bottom-6 left-6">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-[14px] text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-lg">
                  {p.type}
                </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-500 mb-2 group-hover:text-[#87a3a3] transition-colors">{p.name}</h3>
              <p className="text-sm font-medium text-slate-300 mb-8 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#87a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {p.address}
              </p>
              <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                <button className="text-[#87a3a3] font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2">
                  Full Dossier
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex gap-1">
                  <button className="p-3 text-slate-200 hover:text-[#87a3a3] hover:bg-slate-50 rounded-2xl transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Properties;
