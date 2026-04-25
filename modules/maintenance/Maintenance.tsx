
import React, { useState, useMemo } from 'react';
import { MaintenanceTask, Property, MaintenanceStatus } from '@/shared/types';
import { getMaintenanceAdvice } from '@/core/services/geminiService';
import { Logo } from '@/shared/ui/constants';

interface MaintenanceProps {
  tasks: MaintenanceTask[];
  setTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  properties: Property[];
}

const STATUS_OPTIONS: (MaintenanceStatus | 'All')[] = [
  'All',
  'Identified',
  'Assessing',
  'Quote',
  'Tech Review',
  'Approved by Tech',
  'Owner Review',
  'Approved by Owner',
  'Shop Materials',
  'Coordinate',
  'Scheduled',
  'Complete'
];

const getStatusColor = (status: MaintenanceStatus) => {
  switch (status) {
    case 'Identified': return 'bg-slate-50 text-slate-500';
    case 'Assessing': return 'bg-blue-50 text-blue-500';
    case 'Quote': return 'bg-amber-50 text-amber-500';
    case 'Tech Review': return 'bg-[#87a3a310] text-[#87a3a3]';
    case 'Approved by Tech': return 'bg-[#87a3a320] text-[#87a3a3]';
    case 'Owner Review': return 'bg-purple-50 text-purple-500';
    case 'Approved by Owner': return 'bg-purple-100 text-purple-600';
    case 'Shop Materials': return 'bg-cyan-50 text-cyan-500';
    case 'Coordinate': return 'bg-emerald-50 text-emerald-500';
    case 'Scheduled': return 'bg-emerald-100 text-emerald-600';
    case 'Complete': return 'bg-[#87a3a3] text-white';
    default: return 'bg-slate-50 text-slate-500';
  }
};

const Maintenance: React.FC<MaintenanceProps> = ({ tasks, setTasks, properties }) => {
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'All'>('All');

  const counts = useMemo(() => {
    const acc: Record<string, number> = { All: tasks.length };
    tasks.forEach(task => {
      acc[task.status] = (acc[task.status] || 0) + 1;
    });
    return acc;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'All') return tasks;
    return tasks.filter(t => t.status === filterStatus);
  }, [tasks, filterStatus]);

  const fetchAdvice = async (task: MaintenanceTask) => {
    setSelectedTask(task);
    setIsLoadingAdvice(true);
    const correlationId = crypto.randomUUID();
    const result = await getMaintenanceAdvice(task.title, task.description, correlationId);
    setAdvice(result || "Could not get advice.");
    setIsLoadingAdvice(false);
  };

  const updateStatus = (taskId: string, newStatus: MaintenanceStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const updateDateField = (taskId: string, field: 'assessmentDate' | 'scheduledDate', value: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-500 tracking-tight">Maintenance Pipeline</h2>
          <p className="text-slate-400 font-medium">Coordinate logistics and upkeep across all assets.</p>
        </div>
        <button className="px-8 py-4 bg-[#87a3a3] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#87a3a340] hover:bg-[#6b8686] hover:translate-y-[-2px] transition-all flex-shrink-0">
          + Create Job
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex overflow-x-auto pb-6 gap-3 no-scrollbar scroll-smooth">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilterStatus(opt)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 flex items-center gap-3 ${
              filterStatus === opt 
                ? 'bg-[#87a3a3] border-[#87a3a3] text-white shadow-lg' 
                : 'bg-white border-slate-100 text-slate-300 hover:border-[#87a3a320] hover:text-slate-500'
            }`}
          >
            {opt}
            <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
              filterStatus === opt ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-300'
            }`}>
              {counts[opt] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Task List */}
        <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white p-7 rounded-[32px] shadow-sm border-2 transition-all cursor-pointer group ${
                  selectedTask?.id === task.id ? 'border-[#87a3a3] ring-4 ring-[#87a3a310]' : 'border-slate-50 hover:border-slate-200'
                }`}
                onClick={() => fetchAdvice(task)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAdvice(task)}
                role="button"
                tabIndex={0}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-500 text-xl leading-tight group-hover:text-[#87a3a3] transition-colors truncate">{task.title}</h3>
                    <p className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-widest">{properties.find(p => p.id === task.propertyId)?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      task.priority === 'High' ? 'bg-rose-400 text-white' : 
                      task.priority === 'Medium' ? 'bg-amber-400 text-white' : 'bg-slate-300 text-white'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 font-medium line-clamp-2 mb-6 leading-relaxed italic">&quot;{task.description}&quot;</p>
                
                {(task.status === 'Assessing' || task.status === 'Scheduled') && (
                  <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                        {task.status === 'Assessing' ? 'Site Visit' : 'Technician Arrival'}
                      </p>
                      <p className="text-sm font-black text-[#87a3a3]">
                        {task.status === 'Assessing' ? (task.assessmentDate || 'Pending Schedule') : (task.scheduledDate || 'Pending Schedule')}
                      </p>
                    </div>
                    <div className="p-2 bg-white rounded-xl text-[#87a3a3] shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Deadline: {task.dueDate}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label htmlFor={`status-${task.id}`} className="text-[9px] font-black text-slate-200 uppercase tracking-widest">Workflow Step</label>
                    <select 
                      id={`status-${task.id}`}
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value as MaintenanceStatus)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-slate-500 focus:ring-4 focus:ring-[#87a3a320] outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all uppercase tracking-widest"
                    >
                      {STATUS_OPTIONS.filter(o => o !== 'All').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-24 rounded-[40px] border-4 border-dashed border-slate-50 flex flex-col items-center justify-center text-center">
              <div className="p-8 bg-slate-50 rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h4 className="text-xl font-black text-slate-400 mb-2">No active jobs</h4>
              <p className="text-slate-300 font-medium max-w-xs mx-auto">The board is clear for &quot;{filterStatus}&quot;.</p>
            </div>
          )}
        </div>

        {/* Gemini Advice Panel */}
        <div className="bg-slate-900 text-white rounded-[40px] p-10 flex flex-col h-full sticky top-10 shadow-2xl">
          {selectedTask ? (
            <>
              <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-[#87a3a3] rounded-2xl shadow-lg shadow-[#87a3a330]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-tight">AI Dispatcher</h3>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Operational Guidance</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black px-3 py-1 bg-white/10 rounded-lg text-white/70 uppercase">Ref: {selectedTask.id}</span>
                  <span className="text-[10px] font-black px-3 py-1 bg-[#87a3a3]/20 rounded-lg text-[#87a3a3] uppercase">Status: {selectedTask.status}</span>
                </div>
              </header>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar-dark pr-2">
                {isLoadingAdvice ? (
                  <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="relative">
                      <div className="animate-ping absolute inset-0 rounded-full bg-[#87a3a3] opacity-20"></div>
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#87a3a3]"></div>
                    </div>
                    <p className="text-[#87a3a3] font-black text-xs uppercase tracking-widest animate-pulse">Running Diagnostic Protocols...</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fadeIn">
                    {/* Status Specific Date Input */}
                    {(selectedTask.status === 'Assessing' || selectedTask.status === 'Scheduled') && (
                      <div className="bg-white/5 p-7 rounded-[32px] border border-white/10 backdrop-blur-sm">
                        <h4 className="text-[10px] font-black text-[#87a3a3] uppercase mb-5 tracking-[0.3em]">
                          Scheduling Engine
                        </h4>
                        <div className="relative">
                          <input 
                            type="datetime-local" 
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:ring-4 focus:ring-[#87a3a320] outline-none transition-all"
                            value={selectedTask.status === 'Assessing' ? (selectedTask.assessmentDate || '') : (selectedTask.scheduledDate || '')}
                            onChange={(e) => updateDateField(selectedTask.id, selectedTask.status === 'Assessing' ? 'assessmentDate' : 'scheduledDate', e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-white/30 mt-4 font-medium">Auto-sync with technician calendar is enabled.</p>
                      </div>
                    )}

                    <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <h4 className="text-[10px] font-black text-[#87a3a3] uppercase mb-5 tracking-[0.3em]">Strategy & Protocol</h4>
                      <p className="text-white font-medium text-base leading-relaxed italic">
                        &quot;{advice}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white/5 p-6 rounded-[24px] border border-white/10">
                        <p className="text-[9px] text-[#87a3a3] uppercase font-black mb-2 tracking-widest">Est. Cost Basis</p>
                        <p className="text-2xl font-black text-white">$---</p>
                        <div className="h-1 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-[#87a3a3] w-1/3"></div>
                        </div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-[24px] border border-white/10">
                        <p className="text-[9px] text-emerald-500 uppercase font-black mb-2 tracking-widest">SLA Deadline</p>
                        <p className="text-2xl font-black text-white">{selectedTask.dueDate.split('-').slice(1).join('/')}</p>
                        <p className="text-[9px] text-white/30 mt-3 font-bold">On Schedule</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="mt-10 w-full py-5 bg-[#87a3a3] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#6b8686] hover:translate-y-[-2px] transition-all shadow-xl shadow-[#87a3a320] active:translate-y-0 active:scale-95">
                Advance To Next Phase
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-10">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-[#87a3a3] opacity-20 scale-150"></div>
                <div className="relative p-10 bg-white/5 rounded-full border border-white/10">
                  <Logo size="lg" />
                </div>
              </div>
              <div className="max-w-xs space-y-4">
                <h4 className="text-2xl font-black text-white tracking-tight">System Ready</h4>
                <p className="text-slate-500 font-bold text-sm leading-relaxed tracking-tight">Select a job profile from the ledger to initiate AI-assisted coordination and scheduling protocols.</p>
              </div>
              <div className="flex gap-2">
                {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10"></div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
