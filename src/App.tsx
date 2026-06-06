import React, { useState, useEffect } from 'react';
import ClinicMap from './components/ClinicMap';
import PatientPanel from './components/PatientPanel';
import { Patient, LocationId } from './types';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<LocationId | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${yr}/${mo}/${da} ${hr}:${mi}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLocationClick = (locationId: LocationId) => {
    setActiveLocationId(locationId);
  };

  const handleClosePanel = () => {
    setActiveLocationId(null);
  };

  const handleAdmit = (locationId: LocationId, chiefComplaint: string) => {
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      chiefComplaint,
      locationId,
      interviewRecord: '',
      progressEntries: [{ id: crypto.randomUUID(), time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), text: '' }],
      vitals: { temp: '', bpSys: '', bpDia: '', pr: '', spo2: '', rr: '', jcs: '0 (清明)' },
      admittedAt: Date.now(),
      nurseInCharge: '大城親吉',
      arrivalMethod: 'ウォークイン',
      companion: '単独',
      companionOtherText: '',
    };
    setPatients(prev => [...prev, newPatient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDischarge = (patientId: string) => {
    if (window.confirm('この対応を終了し、マップから消去しますか？')) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setActiveLocationId(null);
    }
  };

  const handleTransfer = (patientId: string, newLocation: LocationId) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, locationId: newLocation } : p));
    setActiveLocationId(newLocation);
  };

  const activePatient = activeLocationId ? patients.find(p => p.locationId === activeLocationId) : undefined;
  const occupiedLocations = patients.map(p => p.locationId);

  return (
    <div className="flex flex-col h-screen w-full bg-[#f1f5f9] font-sans text-slate-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 w-full">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">ER Clinic Management <span className="text-slate-400 font-medium ml-2">v2.4.0</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</div>
            <div className="text-sm font-semibold text-green-600 flex items-center gap-1 justify-end mt-0.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> System Active
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-sm font-medium w-[110px] text-right">{currentTime || 'Loading...'}</div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden p-4 gap-4 pb-[48px] relative">
        <ClinicMap 
             patients={patients} 
             onLocationClick={handleLocationClick} 
             activeLocationId={activeLocationId} 
             hasActivePanel={!!activeLocationId}
        />

        {activeLocationId && (
          <PatientPanel
            locationId={activeLocationId}
            patient={activePatient}
            onClose={handleClosePanel}
            onAdmit={handleAdmit}
            onUpdate={handleUpdatePatient}
            onDischarge={handleDischarge}
            onTransfer={handleTransfer}
            allLocationsOccupied={occupiedLocations}
          />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-slate-800 text-white flex items-center px-4 text-[10px] gap-8 shrink-0 uppercase tracking-wider absolute bottom-0 w-full z-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Login:</span> <span className="font-bold">山田 看護師 (ER)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Occupancy:</span> <span className="font-bold">{patients.length} / 7 Slots</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div> Critical
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div> In Exam
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Stable
          </div>
        </div>
      </footer>
    </div>
  );
}
