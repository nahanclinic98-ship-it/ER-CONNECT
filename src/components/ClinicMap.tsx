import React from 'react';
import { Patient, LocationId } from '../types';

interface ClinicMapProps {
  patients: Patient[];
  onLocationClick: (locationId: LocationId) => void;
  activeLocationId?: LocationId | null;
  hasActivePanel: boolean;
}

export default function ClinicMap({ patients, onLocationClick, activeLocationId, hasActivePanel }: ClinicMapProps) {
  const getPatient = (locId: LocationId) => patients.find((p) => p.locationId === locId);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const renderSlot = (id: LocationId, label: string, styleProfile: 'dash' | 'blue' | 'dark') => {
    const patient = getPatient(id);
    const isActive = activeLocationId === id;
    const isOccupied = !!patient;

    let outerClasses = '';
    let labelClasses = '';
    
    if (styleProfile === 'dash') {
      outerClasses = `border-2 border-dashed ${isActive ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200 bg-slate-50'} rounded-lg p-2 flex flex-col transition-colors min-h-0`;
      labelClasses = `text-lg font-bold ${isActive ? 'text-blue-500' : 'text-slate-500'} uppercase shrink-0`;
    } else if (styleProfile === 'blue') {
      outerClasses = `border-2 ${isActive ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-600'} rounded-lg p-2 bg-blue-50/50 flex flex-col transition-all min-h-0`;
      labelClasses = `text-lg font-bold text-blue-600 uppercase shrink-0`;
    } else if (styleProfile === 'dark') {
      outerClasses = `border-2 ${isActive ? 'border-slate-800 ring-2 ring-slate-300' : 'border-slate-800'} rounded-lg p-2 bg-slate-100 flex flex-col transition-all min-h-0`;
      labelClasses = `text-lg font-bold text-slate-800 uppercase shrink-0`;
    }

    let patientCardClasses = '';
    let avatarClasses = '';
    
    if (id === 'bed-1') {
       patientCardClasses = 'bg-red-50 border border-red-200 p-1.5 rounded shadow-sm flex items-center gap-2 ring-2 ring-red-500 ring-offset-2 cursor-pointer w-full';
       avatarClasses = 'w-7 h-7 rounded-full shrink-0 bg-red-500 flex items-center justify-center text-white font-bold text-[10px]';
    } else if (id === 'bed-3') {
       patientCardClasses = 'bg-amber-50 border border-amber-300 p-1.5 rounded shadow-sm flex items-center gap-2 animate-pulse cursor-pointer w-full';
       avatarClasses = 'w-7 h-7 rounded-full shrink-0 bg-amber-500 flex items-center justify-center text-white font-bold text-[10px]';
    } else if (id === 'bed-4') {
       patientCardClasses = 'bg-white border border-slate-200 p-1.5 rounded shadow-sm flex items-center gap-2 cursor-pointer opacity-60 w-full';
       avatarClasses = 'w-7 h-7 rounded-full shrink-0 bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]';
    } else {
       patientCardClasses = 'bg-white border border-blue-200 p-1.5 rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 w-full';
       avatarClasses = 'w-7 h-7 rounded-full shrink-0 bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]';
    }

    if (isActive && id !== 'bed-1') {
      patientCardClasses += ' ring-2 ring-blue-500 ring-offset-1'; 
    }

    return (
      <div className={outerClasses} onClick={() => onLocationClick(id)}>
        <span className={labelClasses}>{label}</span>
        <div className="flex-1 flex items-center justify-center mt-1 cursor-pointer w-full min-h-0 overflow-hidden">
          {isOccupied ? (
            <div className={patientCardClasses}>
              <div className={avatarClasses}>{getInitials(patient.chiefComplaint)}</div>
              <div className="text-xs font-bold truncate">{patient.chiefComplaint}</div>
            </div>
          ) : (
             <div className="text-xs text-slate-400 font-medium italic hover:text-slate-600 border border-transparent p-1">Empty</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className={`${hasActivePanel ? 'w-[600px] shrink-0' : 'w-full max-w-5xl mx-auto'} flex flex-col transition-all duration-300 min-h-0 h-full`}>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex-1 relative flex flex-col min-h-0 overflow-hidden">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 shrink-0">Clinic Floor Layout</h2>
        
        <div className="grid grid-cols-2 grid-rows-[repeat(3,minmax(0,1fr))] gap-3 flex-1 min-h-0">
          {/* Row 1: Back Area */}
          {renderSlot("bed-2", "処置室 (ベッド②)", "dash")}
          {renderSlot("bed-1", "診察室 (ベッド①)", "blue")}

          {/* Row 2: Middle Area */}
          {renderSlot("bed-4", "操作室 (ベッド④)", "dash")}
          {renderSlot("bed-3", "レントゲン室 (ベッド③)", "dark")}
          
          {/* Row 3: Entrance & Waiting */}
          <div className="border-2 border-slate-400 border-double rounded-lg p-2 bg-white flex flex-col items-center justify-center min-h-0">
            <svg className="text-slate-300 mb-1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 19V15H11V19H13M19 19V9L12 3L5 9V19H19Z"/></svg>
            <span className="text-lg font-bold text-slate-600 uppercase">玄関</span>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col cursor-pointer transition-colors hover:bg-slate-100/50 min-h-0" onClick={() => onLocationClick('wait-1')}>
            <span className="text-lg font-bold text-slate-500 uppercase mb-1 shrink-0">待合室 (3枠)</span>
            <div className="flex-1 flex flex-col justify-center gap-1.5 min-h-0">
              {[1, 2, 3].map(i => {
                const wId = `wait-${i}` as LocationId;
                const p = getPatient(wId);
                const isWActive = activeLocationId === wId;
                if (p) {
                   return (
                    <div key={wId} onClick={(e) => { e.stopPropagation(); onLocationClick(wId); }} className={`flex-1 min-h-0 cursor-pointer bg-white border border-slate-200 rounded flex items-center px-2 py-0.5 text-[11px] font-medium shadow-sm transition-all overflow-hidden ${isWActive ? 'ring-2 ring-blue-500 border-transparent z-10 relative' : 'hover:bg-slate-50'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2 shrink-0"></span> <span className="truncate">待機: {p.chiefComplaint}</span>
                    </div>
                   );
                } else {
                   return (
                    <div key={wId} onClick={(e) => { e.stopPropagation(); onLocationClick(wId); }} className={`flex-1 min-h-0 cursor-pointer bg-white/50 border border-dashed border-slate-200 rounded flex items-center px-2 py-0.5 text-[10px] text-slate-400 transition-all overflow-hidden ${isWActive ? 'ring-2 ring-blue-300 border-transparent bg-blue-50/30' : 'hover:bg-white'}`}>
                      Empty
                    </div>
                   );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
