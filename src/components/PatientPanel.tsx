import React, { useState } from 'react';
import { Patient, LocationId, ArrivalMethod, CompanionType, ProgressEntry } from '../types';
import { Save, MapPin, User, Plus, Minus, Copy, Check, Edit2 } from 'lucide-react';

interface PatientPanelProps {
  locationId: LocationId;
  patient: Patient | undefined;
  onClose: () => void;
  onAdmit: (locationId: LocationId, chiefComplaint: string) => void;
  onUpdate: (patient: Patient) => void;
  onDischarge: (patientId: string) => void;
  onTransfer: (patientId: string, newLocation: LocationId) => void;
  allLocationsOccupied: LocationId[];
}

const LOCATION_NAMES: Record<LocationId, string> = {
  'bed-1': '診察室 (ベッド①)',
  'bed-2': '処置室 (ベッド②)',
  'bed-3': 'レントゲン室 (ベッド③)',
  'bed-4': '操作室 (ベッド④)',
  'wait-1': '待合室 - 席1',
  'wait-2': '待合室 - 席2',
  'wait-3': '待合室 - 席3',
};

export default function PatientPanel({
  locationId,
  patient,
  onClose,
  onAdmit,
  onUpdate,
  onDischarge,
  onTransfer,
  allLocationsOccupied,
}: PatientPanelProps) {
  const [activeTab, setActiveTab] = useState<'interview' | 'progress'>('interview');
  const [newComplaint, setNewComplaint] = useState('');
  const [copiedInterview, setCopiedInterview] = useState(false);
  const [copiedProgress, setCopiedProgress] = useState(false);

  const [isEditingComplaint, setIsEditingComplaint] = useState(false);
  const [editComplaintText, setEditComplaintText] = useState('');

  React.useEffect(() => {
    if (patient) {
      setEditComplaintText(patient.chiefComplaint);
      setIsEditingComplaint(false);
    }
  }, [patient?.id, patient?.chiefComplaint]);

  const [modalState, setModalState] = useState<{ type: 'vitals' | 'blood' | 'iv' | 'vaccine' | 'urinalysis' | null; entryId: string | null; }>({ type: null, entryId: null });
  const [vitalsForm, setVitalsForm] = useState({ temp: '', bpSys: '', bpDia: '', pr: '', spo2: '', rr: '', jcs: '' });
  const [bloodForm, setBloodForm] = useState({ side: '右', position: '正中', positionOther: '', items: [] as string[], hemostasis: 'OK', hemostasisOther: '' });
  const [ivForm, setIvForm] = useState({ side: '右', position: '正中', positionOther: '', gauge: '22G', drugs: [] as string[], bloodTestAlso: false, bloodItems: [] as string[] });
  
  const defaultVaccine = () => ({ drug: 'インフルエンザ', drugOther: '', site: '右上腕', siteOther: '', method: '皮下注', problem: 'なし', problemOther: '' });
  const [vaccinesForm, setVaccinesForm] = useState([defaultVaccine()]);

  const [urinalysisForm, setUrinalysisForm] = useState({ glucose: 'ー', protein: 'ー', bilirubin: 'ー', urobilinogen: 'ー', ph: '5', specificGravity: '1.000', occultBlood: 'ー', ketone: 'ー', nitrite: 'ー', leukocytes: 'ー' });

  const openModal = (type: 'vitals' | 'blood' | 'iv' | 'vaccine' | 'urinalysis', entryId: string) => {
    setModalState({ type, entryId });
    if (type === 'vitals') setVitalsForm({ temp: '', bpSys: '', bpDia: '', pr: '', spo2: '', rr: '', jcs: '' });
    if (type === 'blood') setBloodForm({ side: '右', position: '正中', positionOther: '', items: [], hemostasis: 'OK', hemostasisOther: '' });
    if (type === 'iv') setIvForm({ side: '右', position: '正中', positionOther: '', gauge: '22G', drugs: [], bloodTestAlso: false, bloodItems: [] });
    if (type === 'vaccine') setVaccinesForm([defaultVaccine()]);
    if (type === 'urinalysis') setUrinalysisForm({ glucose: 'ー', protein: 'ー', bilirubin: 'ー', urobilinogen: 'ー', ph: '5', specificGravity: '1.000', occultBlood: 'ー', ketone: 'ー', nitrite: 'ー', leukocytes: 'ー' });
  };

  const handleBloodItemToggle = (item: string) => {
    setBloodForm(prev => ({
      ...prev,
      items: prev.items.includes(item) ? prev.items.filter(i => i !== item) : [...prev.items, item]
    }));
  };

  const handleIvDrugToggle = (item: string) => {
    setIvForm(prev => ({
      ...prev,
      drugs: prev.drugs.includes(item) ? prev.drugs.filter(i => i !== item) : [...prev.drugs, item]
    }));
  };

  const handleIvBloodItemToggle = (item: string) => {
    setIvForm(prev => ({
      ...prev,
      bloodItems: prev.bloodItems.includes(item) ? prev.bloodItems.filter(i => i !== item) : [...prev.bloodItems, item]
    }));
  };

  const submitVitals = () => {
    if (!modalState.entryId) return;
    const t = `【バイタル】体温: ${vitalsForm.temp || '-'}℃, 血圧: ${vitalsForm.bpSys || '-'}/${vitalsForm.bpDia || '-'}mmHg, 脈拍: ${vitalsForm.pr || '-'}bpm, SpO2: ${vitalsForm.spo2 || '-'}%, 呼吸: ${vitalsForm.rr || '-'}回/分, 意識(JCS): ${vitalsForm.jcs || '-'}`;
    appendToProgressEntry(modalState.entryId, t);
    setModalState({ type: null, entryId: null });
  };

  const submitBlood = () => {
    if (!modalState.entryId) return;
    const pos = bloodForm.position === 'その他' ? bloodForm.positionOther : bloodForm.position;
    const hemostasis = bloodForm.hemostasis === '異常あり' ? `異常あり(${bloodForm.hemostasisOther})` : 'OK';
    const itemsText = bloodForm.items.length > 0 ? bloodForm.items.join('・') : 'なし';
    const t = `${bloodForm.side}${pos}から採血し、${itemsText}採取。止血確認: ${hemostasis}。`;
    appendToProgressEntry(modalState.entryId, t);
    setModalState({ type: null, entryId: null });
  };

  const submitIv = () => {
    if (!modalState.entryId) return;
    const pos = ivForm.position === 'その他' ? ivForm.positionOther : ivForm.position;
    const drugsText = ivForm.drugs.length > 0 ? ivForm.drugs.join(' ・ ') : 'なし';
    let t = `${ivForm.side} (${pos})から 、${ivForm.gauge}ライン確保し、${drugsText}投与開始。滴下良好。刺入部異常なし。`;
    
    if (ivForm.bloodTestAlso) {
      if (ivForm.bloodItems.length > 0) {
        t += `\n採血（${ivForm.bloodItems.join('・')}）も実施。`;
      } else {
        t += `\n採血も実施。`;
      }
    }
    
    appendToProgressEntry(modalState.entryId, t);
    setModalState({ type: null, entryId: null });
  };

  const submitVaccine = () => {
    if (!modalState.entryId) return;
    const texts = vaccinesForm.map((v, i) => {
      const drug = v.drug === 'その他' ? v.drugOther : v.drug;
      const site = v.site === 'その他' ? v.siteOther : v.site;
      const problem = v.problem === 'あり' ? `あり(${v.problemOther})` : 'なし';
      return `【予防接種${vaccinesForm.length > 1 ? i+1 : ''}】薬剤: ${drug} / 箇所: ${site} / 方法: ${v.method} / 問題の有無: ${problem}`;
    });
    appendToProgressEntry(modalState.entryId, texts.join('\n'));
    setModalState({ type: null, entryId: null });
  };

  const submitUrinalysis = () => {
    if (!modalState.entryId) return;
    const t = `【検尿】糖: ${urinalysisForm.glucose} / 蛋白: ${urinalysisForm.protein} / ビリルビン: ${urinalysisForm.bilirubin} / ウロビリノーゲン: ${urinalysisForm.urobilinogen} / pH: ${urinalysisForm.ph} / 比重: ${urinalysisForm.specificGravity} / 潜血: ${urinalysisForm.occultBlood} / ケトン体: ${urinalysisForm.ketone} / 亜硝酸塩: ${urinalysisForm.nitrite} / 白血球: ${urinalysisForm.leukocytes}`;
    appendToProgressEntry(modalState.entryId, t);
    setModalState({ type: null, entryId: null });
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplaint.trim()) {
      onAdmit(locationId, newComplaint.trim());
      setNewComplaint('');
    }
  };

  const handleRecordChange = (field: keyof Patient, value: any) => {
    if (patient) {
      onUpdate({ ...patient, [field]: value });
    }
  };

  const handleVitalsChange = (field: keyof Patient['vitals'], value: string) => {
    if (patient) {
      onUpdate({ ...patient, vitals: { ...patient.vitals, [field]: value } });
    }
  };

  const handleAddProgressEntry = () => {
    if (!patient) return;
    const newEntry: ProgressEntry = {
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      text: ''
    };
    onUpdate({
      ...patient,
      progressEntries: [...patient.progressEntries, newEntry]
    });
  };

  const handleRemoveProgressEntry = (entryId: string) => {
    if (!patient) return;
    onUpdate({
      ...patient,
      progressEntries: patient.progressEntries.filter(e => e.id !== entryId)
    });
  };

  const handleChangeProgressEntry = (entryId: string, field: 'time' | 'text', value: string) => {
     if (!patient) return;
     onUpdate({
       ...patient,
       progressEntries: patient.progressEntries.map(e => e.id === entryId ? { ...e, [field]: value } : e)
     });
  };

  const appendToProgressEntry = (entryId: string, textToAppend: string) => {
    if (!patient) return;
    const entry = patient.progressEntries.find(e => e.id === entryId);
    if (!entry) return;
    const newText = entry.text ? `${entry.text}\n${textToAppend}` : textToAppend;
    handleChangeProgressEntry(entryId, 'text', newText);
  };

  const generateInterviewReport = () => {
    if (!patient) return '';
    const companionText = patient.companion === 'その他' ? patient.companionOtherText : patient.companion;
    
    let report = `【主訴】${patient.chiefComplaint}\n`;
    report += `【対応】${patient.nurseInCharge}\n`;
    report += `【来院方法】${patient.arrivalMethod || '-'}\n`;
    report += `【付添い】${companionText || '-'}\n\n`;
    report += `【バイタル】\n`;
    report += `体温: ${patient.vitals.temp || '-'} ℃\n`;
    report += `血圧: ${patient.vitals.bpSys || '-'}/${patient.vitals.bpDia || '-'} mmHg\n`;
    report += `脈拍: ${patient.vitals.pr || '-'} bpm\n`;
    report += `SpO2: ${patient.vitals.spo2 || '-'} %\n`;
    report += `呼吸: ${patient.vitals.rr || '-'} 回/分\n`;
    report += `意識レベル(JCS): ${patient.vitals.jcs || '-'}\n\n`;
    report += `【問診記録】\n${patient.interviewRecord || '-'}\n`;
    return report;
  };

  const generateProgressReport = () => {
    if (!patient) return '';
    let report = `【経過記録】\n`;
    if (patient.progressEntries.length === 0) {
      report += '記録なし\n';
    } else {
      patient.progressEntries.forEach((entry, index) => {
        report += `${entry.time} : \n${entry.text}\n`;
        if (index < patient.progressEntries.length - 1) {
          report += `\n`;
        }
      });
    }
    return report;
  };

  const copyInterviewReport = async () => {
    try {
      await navigator.clipboard.writeText(generateInterviewReport());
      setCopiedInterview(true);
      setTimeout(() => setCopiedInterview(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyProgressReport = async () => {
    try {
      await navigator.clipboard.writeText(generateProgressReport());
      setCopiedProgress(true);
      setTimeout(() => setCopiedProgress(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <aside className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full relative">
      {!patient ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-slate-100 text-slate-800 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2 font-bold text-sm">
               <MapPin className="w-4 h-4 text-slate-500" />
               {LOCATION_NAMES[locationId]}
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">✕</button>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-50/50">
             <div className="w-12 h-12 bg-white border-2 border-slate-200 text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <User className="w-6 h-6" />
             </div>
             <h3 className="text-sm font-bold text-slate-700 mb-1 uppercase tracking-wider">Empty Slot</h3>
             <p className="text-xs text-slate-500 mb-6 font-medium text-center">この場所に新しい患者を配置しますか？</p>
             <form onSubmit={handleAdmitSubmit} className="w-full max-w-xs flex flex-col gap-3">
               <input type="text" placeholder="主訴・受診目的を入力..." value={newComplaint} onChange={(e) => setNewComplaint(e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white" autoFocus />
               <button type="submit" disabled={!newComplaint.trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition">配置・登録する</button>
             </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Record Header */}
          <div className="bg-slate-900 text-white p-4 shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                {isEditingComplaint ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="text-lg font-bold bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white w-full focus:outline-none focus:border-blue-500"
                      value={editComplaintText}
                      onChange={(e) => setEditComplaintText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editComplaintText.trim()) {
                           onUpdate({ ...patient, chiefComplaint: editComplaintText.trim() });
                           setIsEditingComplaint(false);
                        }
                      }}
                      autoFocus
                    />
                    <button onClick={() => {
                        if (editComplaintText.trim()) {
                            onUpdate({ ...patient, chiefComplaint: editComplaintText.trim() });
                        }
                        setIsEditingComplaint(false);
                    }} className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded"><Check className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingComplaint(true)}>
                    <h3 className="text-lg font-bold">{patient.chiefComplaint}</h3>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                )}
                <p className="text-xs text-blue-400 font-bold mt-1">配置: {LOCATION_NAMES[locationId]}</p>
              </div>
              <button onClick={() => onDischarge(patient.id)} className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 px-3 py-1 rounded text-xs font-bold tracking-wider transition">帰宅 / 消去</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button onClick={() => setActiveTab('interview')} className={`flex-1 py-3 text-sm font-bold border-b-2 outline-none transition-colors ${activeTab === 'interview' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 bg-slate-50 hover:bg-slate-100'}`}>問診記録</button>
            <button onClick={() => setActiveTab('progress')} className={`flex-1 py-3 text-sm font-bold border-b-2 outline-none transition-colors ${activeTab === 'progress' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 bg-slate-50 hover:bg-slate-100'}`}>経過記録</button>
            <button onClick={onClose} className="px-4 border-b-2 border-transparent outline-none text-slate-400 bg-slate-50 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {activeTab === 'interview' && (
              <div className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0">対応Ns</label>
                  <input 
                    type="text" 
                    value={patient.nurseInCharge} 
                    onChange={(e) => handleRecordChange('nurseInCharge', e.target.value)} 
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0">来院方法</label>
                  <select 
                    value={patient.arrivalMethod} 
                    onChange={(e) => handleRecordChange('arrivalMethod', e.target.value)} 
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">選択してください</option>
                    <option value="ウォークイン">ウォークイン</option>
                    <option value="車いす">車いす</option>
                    <option value="救急搬送">救急搬送</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0">付添い</label>
                  <select 
                    value={patient.companion} 
                    onChange={(e) => handleRecordChange('companion', e.target.value)} 
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">選択してください</option>
                    <option value="単独">単独</option>
                    <option value="配偶者">配偶者</option>
                    <option value="父">父</option>
                    <option value="母">母</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                {patient.companion === 'その他' && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-20 shrink-0 text-right pr-2">詳細</label>
                    <input 
                      type="text" 
                      placeholder="続柄・関係などを入力" 
                      value={patient.companionOtherText} 
                      onChange={(e) => handleRecordChange('companionOtherText', e.target.value)} 
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 flex-1 flex flex-col pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex justify-between items-center">
                <span>{activeTab === 'interview' ? 'Interview Record / History' : 'Progress / Physical Findings'}</span>
                <div className="flex items-center gap-2">
                  {activeTab === 'progress' && (
                      <button onClick={handleAddProgressEntry} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition">
                        <Plus className="w-3 h-3" /> <span className="uppercase tracking-wider text-[10px]">追加</span>
                      </button>
                  )}
                </div>
              </label>
              
              {activeTab === 'interview' ? (
                <>
                  <div className="flex flex-col gap-2 mb-3 shrink-0 bg-white p-2 rounded border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Vitals / バイタルサイン</div>
                    <div className="grid grid-cols-3 gap-2">
                       <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">体温</label>
                          <div className="flex items-center gap-1">
                            <input type="text" value={patient.vitals.temp} onChange={(e) => handleVitalsChange('temp', e.target.value)} placeholder="36.5" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                            <span className="text-[10px] text-slate-400 font-medium">℃</span>
                          </div>
                       </div>
                       <div className="col-span-2">
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">血圧 (収縮期 / 拡張期)</label>
                          <div className="flex items-center gap-1">
                            <input type="text" value={patient.vitals.bpSys} onChange={(e) => handleVitalsChange('bpSys', e.target.value)} placeholder="120" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                            <span className="text-slate-400 text-xs">/</span>
                            <input type="text" value={patient.vitals.bpDia} onChange={(e) => handleVitalsChange('bpDia', e.target.value)} placeholder="80" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">mmHg</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">脈拍</label>
                          <div className="flex items-center gap-1">
                            <input type="text" value={patient.vitals.pr} onChange={(e) => handleVitalsChange('pr', e.target.value)} placeholder="70" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                            <span className="text-[10px] text-slate-400 font-medium">bpm</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">SpO2</label>
                          <div className="flex items-center gap-1">
                             <input type="text" value={patient.vitals.spo2} onChange={(e) => handleVitalsChange('spo2', e.target.value)} placeholder="98" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                             <span className="text-[10px] text-slate-400 font-medium">%</span>
                          </div>
                       </div>
                       <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">呼吸</label>
                          <div className="flex items-center gap-1">
                             <input type="text" value={patient.vitals.rr} onChange={(e) => handleVitalsChange('rr', e.target.value)} placeholder="16" className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50" />
                             <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">回/分</span>
                          </div>
                       </div>
                       <div className="col-span-3">
                          <label className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">意識レベル (JCS)</label>
                          <select value={patient.vitals.jcs} onChange={(e) => handleVitalsChange('jcs', e.target.value)} className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 bg-slate-50 text-slate-700">
                             <option value="">未選択</option>
                             <option value="0 (清明)">0 (清明)</option>
                             <option value="I-1 (だいたい清明だが、今ひとつはっきりしない)">I-1 (だいたい清明)</option>
                             <option value="I-2 (見当識障害がある)">I-2 (見当識障害)</option>
                             <option value="I-3 (自分の名前、生年月日が言えない)">I-3 (名前・生年月日言えない)</option>
                             <option value="II-10 (普通の呼びかけで容易に開眼する)">II-10 (呼びかけで開眼)</option>
                             <option value="II-20 (大きな声または体を揺さぶることにより開眼する)">II-20 (大声・揺さぶりで開眼)</option>
                             <option value="II-30 (痛み刺激を加えつつ呼びかけを続けると辛うじて開眼する)">II-30 (痛み刺激で辛うじて開眼)</option>
                             <option value="III-100 (痛み刺激に対し、払いのけるような動作をする)">III-100 (痛み刺激に払いのける)</option>
                             <option value="III-200 (痛み刺激で少し手足を動かしたり、顔をしかめたりする)">III-200 (痛みで手足を動かす)</option>
                             <option value="III-300 (痛み刺激に全く反応しない)">III-300 (痛み刺激に無反応)</option>
                          </select>
                       </div>
                    </div>
                  </div>
                  <textarea
                    value={patient.interviewRecord}
                    onChange={(e) => handleRecordChange('interviewRecord', e.target.value)}
                    placeholder="アレルギー、既往歴、主訴などを入力..."
                    className="w-full flex-1 min-h-[100px] bg-slate-50 border border-slate-200 rounded p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-slate-800"
                  />
                </>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {patient.progressEntries.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded bg-slate-50">
                      記録がありません
                    </div>
                  ) : (
                    [...patient.progressEntries].reverse().map((entry) => (
                      <div key={entry.id} className="group flex gap-2 items-start p-2 rounded border border-slate-200 bg-white shadow-sm transition hover:border-blue-300">
                        <input
                          type="text"
                          value={entry.time}
                          onChange={(e) => handleChangeProgressEntry(entry.id, 'time', e.target.value)}
                          className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-slate-600 bg-slate-50 border border-transparent focus:border-blue-300 focus:bg-white rounded focus:outline-none"
                        />
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <textarea
                            value={entry.text}
                            onChange={(e) => handleChangeProgressEntry(entry.id, 'text', e.target.value)}
                            placeholder="記録を入力..."
                            rows={3}
                            className="w-full text-xs px-2 py-1 bg-transparent border border-transparent focus:border-blue-300 rounded focus:outline-none resize-none leading-relaxed text-slate-800"
                          />
                          <div className="flex flex-wrap gap-1 px-1 pb-1">
                            <button onClick={() => appendToProgressEntry(entry.id, 'Dr診察。')} className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-1.5 py-0.5 rounded transition">Dr診察</button>
                            <button onClick={() => appendToProgressEntry(entry.id, '帰宅。')} className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-1.5 py-0.5 rounded transition">帰宅</button>
                            <button onClick={() => openModal('vitals', entry.id)} className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded transition">バイタル</button>
                            <button onClick={() => openModal('blood', entry.id)} className="text-[9px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded transition">採血</button>
                            <button onClick={() => openModal('iv', entry.id)} className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition">点滴</button>
                            <button onClick={() => openModal('vaccine', entry.id)} className="text-[9px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded transition">予防接種</button>
                            <button onClick={() => openModal('urinalysis', entry.id)} className="text-[9px] font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded transition">検尿</button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProgressEntry(entry.id)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded opacity-0 group-hover:opacity-100 transition shrink-0"
                          title="消去"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2 shrink-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transfer Location</label>
              <select
                value={patient.locationId}
                onChange={(e) => onTransfer(patient.id, e.target.value as LocationId)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded p-2.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {(Object.entries(LOCATION_NAMES) as [LocationId, string][]).map(([locId, locName]) => (
                  <option key={locId} value={locId} disabled={locId !== patient.locationId && allLocationsOccupied.includes(locId)}>
                    {locName} {locId !== patient.locationId && allLocationsOccupied.includes(locId) ? '(使用中)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0">
            <button onClick={onClose} className="flex-1 bg-white border border-slate-300 py-2.5 rounded text-xs font-bold hover:bg-slate-100 text-slate-700 transition">閉じる</button>
            <button className="flex-[2] bg-blue-600 text-white py-2.5 rounded text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
              <Save className="w-3.5 h-3.5" /> 保存・確定
            </button>
            <button
              onClick={activeTab === 'interview' ? copyInterviewReport : copyProgressReport}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded text-xs font-bold shadow-md shadow-amber-200 hover:bg-amber-600 transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 animate-[pulse_2s_ease-in-out_infinite]"
            >
              {(activeTab === 'interview' ? copiedInterview : copiedProgress) ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {(activeTab === 'interview' ? copiedInterview : copiedProgress) ? 'コピー済' : 'コピー'}
            </button>
          </div>
        </div>
      )}

      {modalState.type && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-sm flex flex-col overflow-hidden max-h-full">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-700 text-sm">
                {modalState.type === 'vitals' && 'バイタル入力'}
                {modalState.type === 'blood' && '採血入力'}
                {modalState.type === 'iv' && '点滴入力'}
                {modalState.type === 'vaccine' && '予防接種入力'}
                {modalState.type === 'urinalysis' && '検尿入力'}
              </h3>
              <button type="button" onClick={() => setModalState({ type: null, entryId: null })} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {modalState.type === 'vitals' && (
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">体温 (℃)</label>
                     <input type="text" value={vitalsForm.temp} onChange={e => setVitalsForm(v => ({...v, temp: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">脈拍 (bpm)</label>
                     <input type="text" value={vitalsForm.pr} onChange={e => setVitalsForm(v => ({...v, pr: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                   </div>
                   <div className="col-span-2 grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-bold text-slate-500 block mb-1">血圧 (収縮期) mmHg</label>
                       <input type="text" value={vitalsForm.bpSys} onChange={e => setVitalsForm(v => ({...v, bpSys: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-500 block mb-1">血圧 (拡張期) mmHg</label>
                       <input type="text" value={vitalsForm.bpDia} onChange={e => setVitalsForm(v => ({...v, bpDia: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">SpO2 (%)</label>
                     <input type="text" value={vitalsForm.spo2} onChange={e => setVitalsForm(v => ({...v, spo2: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">呼吸 (回/分)</label>
                     <input type="text" value={vitalsForm.rr} onChange={e => setVitalsForm(v => ({...v, rr: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                   </div>
                   <div className="col-span-2">
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">意識レベル (JCS)</label>
                     <select value={vitalsForm.jcs} onChange={e => setVitalsForm(v => ({...v, jcs: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none">
                        <option value="">未選択</option>
                        <option value="0 (清明)">0 (清明)</option>
                        <option value="I-1 (だいたい清明だが、今ひとつはっきりしない)">I-1 (だいたい清明)</option>
                        <option value="I-2 (見当識障害がある)">I-2 (見当識障害)</option>
                        <option value="I-3 (自分の名前、生年月日が言えない)">I-3 (名前・生年月日言えない)</option>
                        <option value="II-10 (普通の呼びかけで容易に開眼する)">II-10 (呼びかけで開眼)</option>
                        <option value="II-20 (大きな声または体を揺さぶることにより開眼する)">II-20 (大声・揺さぶりで開眼)</option>
                        <option value="II-30 (痛み刺激を加えつつ呼びかけを続けると辛うじて開眼する)">II-30 (痛み刺激で辛うじて開眼)</option>
                        <option value="III-100 (痛み刺激に対し、払いのけるような動作をする)">III-100 (痛み刺激に払いのける)</option>
                        <option value="III-200 (痛み刺激で少し手足を動かしたり、顔をしかめたりする)">III-200 (痛みで手足を動かす)</option>
                        <option value="III-300 (痛み刺激に全く反応しない)">III-300 (痛み刺激に無反応)</option>
                     </select>
                   </div>
                 </div>
              )}

              {modalState.type === 'blood' && (
                 <div className="space-y-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">採血部位 (左右)</label>
                     <div className="flex gap-2">
                       {['右', '左'].map(s => (
                         <label key={`blood-side-${s}`} className="flex items-center gap-1 text-xs">
                           <input type="radio" checked={bloodForm.side === s} onChange={() => setBloodForm(v => ({...v, side: s}))} /> {s}
                         </label>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">採血部位 (位置)</label>
                     <div className="flex flex-col gap-1.5">
                       <div className="flex flex-wrap gap-2">
                         {['手背', '前腕', '正中', '上腕', 'その他'].map(s => (
                           <label key={`blood-pos-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                             <input type="radio" checked={bloodForm.position === s} onChange={() => setBloodForm(v => ({...v, position: s, positionOther: s === 'その他' ? v.positionOther : ''}))} /> {s}
                           </label>
                         ))}
                       </div>
                       {bloodForm.position === 'その他' && (
                         <input type="text" value={bloodForm.positionOther} onChange={e => setBloodForm(v => ({...v, positionOther: e.target.value}))} placeholder="その他の部位" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                       )}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">項目 (複数可)</label>
                     <div className="flex flex-wrap gap-2">
                       {['CBC', '生化学', '血糖'].map(s => (
                         <label key={`blood-item-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                           <input type="checkbox" checked={bloodForm.items.includes(s)} onChange={() => handleBloodItemToggle(s)} /> {s}
                         </label>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">止血確認</label>
                     <div className="flex flex-col gap-1.5">
                       <div className="flex gap-4">
                         {['OK', '異常あり'].map(s => (
                           <label key={`blood-hemo-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                             <input type="radio" checked={bloodForm.hemostasis === s} onChange={() => setBloodForm(v => ({...v, hemostasis: s, hemostasisOther: s === '異常あり' ? v.hemostasisOther : ''}))} /> {s}
                           </label>
                         ))}
                       </div>
                       {bloodForm.hemostasis === '異常あり' && (
                         <input type="text" value={bloodForm.hemostasisOther} onChange={e => setBloodForm(v => ({...v, hemostasisOther: e.target.value}))} placeholder="異常の内容" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                       )}
                     </div>
                   </div>
                 </div>
              )}

              {modalState.type === 'iv' && (
                 <div className="space-y-3">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">点滴部位 (左右)</label>
                     <div className="flex gap-4">
                       {['右', '左'].map(s => (
                         <label key={`iv-side-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                           <input type="radio" checked={ivForm.side === s} onChange={() => setIvForm(v => ({...v, side: s}))} /> {s}
                         </label>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">点滴部位 (位置)</label>
                     <div className="flex flex-col gap-1.5">
                       <div className="flex flex-wrap gap-2">
                         {['手背', '前腕', '正中', '上腕', 'その他'].map(s => (
                           <label key={`iv-pos-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                             <input type="radio" checked={ivForm.position === s} onChange={() => setIvForm(v => ({...v, position: s, positionOther: s === 'その他' ? v.positionOther : ''}))} /> {s}
                           </label>
                         ))}
                       </div>
                       {ivForm.position === 'その他' && (
                         <input type="text" value={ivForm.positionOther} onChange={e => setIvForm(v => ({...v, positionOther: e.target.value}))} placeholder="その他の部位" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                       )}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">注射針</label>
                     <div className="flex flex-wrap gap-4">
                       {['24G', '22G', '20G', '18G'].map(s => (
                         <label key={`iv-gauge-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                           <input type="radio" checked={ivForm.gauge === s} onChange={() => setIvForm(v => ({...v, gauge: s}))} /> {s}
                         </label>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">薬剤名 (複数可)</label>
                     <div className="flex flex-col gap-1.5 h-32 overflow-y-auto pr-2 border border-slate-200 rounded p-2">
                       {['ラクテック500ml', 'ソルデム1 200ml', '生食100ml', '生食50ml', 'パレプラス500ml', 'ツインパル1000ml', 'ロセフィン1g', 'セファメジン1g', 'プリンペラン10㎎', 'メイロン７％'].map(s => (
                         <label key={`iv-drug-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                           <input type="checkbox" checked={ivForm.drugs.includes(s)} onChange={() => handleIvDrugToggle(s)} /> {s}
                         </label>
                       ))}
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">同時採血</label>
                     <div className="flex flex-col gap-2 border border-slate-200 rounded p-2 bg-slate-50">
                       <label className="flex items-center gap-1 text-xs cursor-pointer font-bold">
                         <input type="checkbox" checked={ivForm.bloodTestAlso} onChange={e => setIvForm(v => ({...v, bloodTestAlso: e.target.checked}))} /> 採血も実施
                       </label>
                       {ivForm.bloodTestAlso && (
                         <div className="flex flex-wrap gap-2 pl-4">
                           {['CBC', '生化学', '血糖'].map(s => (
                             <label key={`iv-blood-${s}`} className="flex items-center gap-1 text-xs cursor-pointer text-slate-700">
                               <input type="checkbox" checked={ivForm.bloodItems.includes(s)} onChange={() => handleIvBloodItemToggle(s)} /> {s}
                             </label>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
              )}

              {modalState.type === 'vaccine' && (
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2">
                   {vaccinesForm.map((v, idx) => (
                     <div key={idx} className="space-y-3 p-3 border border-slate-200 bg-slate-50 rounded-lg relative">
                       {vaccinesForm.length > 1 && (
                         <button onClick={() => setVaccinesForm(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 flex items-center justify-center p-1 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded transition"><Minus className="w-3.5 h-3.5" /></button>
                       )}
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">薬剤</label>
                         <div className="flex flex-col gap-1.5">
                           <select value={v.drug} onChange={e => setVaccinesForm(prev => { const n = [...prev]; n[idx].drug = e.target.value; n[idx].drugOther = e.target.value === 'その他' ? n[idx].drugOther : ''; return n; })} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                             <option value="インフルエンザ">インフルエンザ</option>
                             <option value="コロナ">コロナ</option>
                             <option value="狂犬病（ラビピュール）">狂犬病（ラビピュール）</option>
                             <option value="破傷風トキソイド">破傷風トキソイド</option>
                             <option value="A型肝炎（エイムゲン）">A型肝炎（エイムゲン）</option>
                             <option value="B型肝炎（ビームゲン）">B型肝炎（ビームゲン）</option>
                             <option value="その他">その他</option>
                           </select>
                           {v.drug === 'その他' && (
                             <input type="text" value={v.drugOther} onChange={e => setVaccinesForm(prev => { const n = [...prev]; n[idx].drugOther = e.target.value; return n; })} placeholder="その他の薬剤" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                           )}
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 block mb-1">箇所</label>
                         <div className="flex flex-col gap-1.5">
                           <div className="flex gap-4">
                             {['右上腕', '左上腕', 'その他'].map(s => (
                               <label key={`vac-site-${idx}-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                                 <input type="radio" checked={v.site === s} onChange={() => setVaccinesForm(prev => { const n = [...prev]; n[idx].site = s; n[idx].siteOther = s === 'その他' ? n[idx].siteOther : ''; return n; })} /> {s}
                               </label>
                             ))}
                           </div>
                           {v.site === 'その他' && (
                             <input type="text" value={v.siteOther} onChange={e => setVaccinesForm(prev => { const n = [...prev]; n[idx].siteOther = e.target.value; return n; })} placeholder="その他の箇所" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none" />
                           )}
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 block mb-1">方法</label>
                           <div className="flex gap-4">
                             {['筋注', '皮下注'].map(s => (
                               <label key={`vac-method-${idx}-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                                 <input type="radio" checked={v.method === s} onChange={() => setVaccinesForm(prev => { const n = [...prev]; n[idx].method = s; return n; })} /> {s}
                               </label>
                             ))}
                           </div>
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-slate-500 block mb-1">問題の有無</label>
                           <div className="flex gap-4">
                             {['なし', 'あり'].map(s => (
                               <label key={`vac-prob-${idx}-${s}`} className="flex items-center gap-1 text-xs cursor-pointer">
                                 <input type="radio" checked={v.problem === s} onChange={() => setVaccinesForm(prev => { const n = [...prev]; n[idx].problem = s; n[idx].problemOther = s === 'あり' ? n[idx].problemOther : ''; return n; })} /> {s}
                               </label>
                             ))}
                           </div>
                         </div>
                       </div>
                       {v.problem === 'あり' && (
                         <input type="text" value={v.problemOther} onChange={e => setVaccinesForm(prev => { const n = [...prev]; n[idx].problemOther = e.target.value; return n; })} placeholder="問題の詳細" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none mt-1" />
                       )}
                     </div>
                   ))}
                   <button type="button" onClick={() => setVaccinesForm(prev => [...prev, defaultVaccine()])} className="w-full py-2 border-2 border-dashed border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                     <Plus className="w-3" /> 追加
                   </button>
                 </div>
              )}

              {modalState.type === 'urinalysis' && (
                 <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2">
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">ブドウ糖</label>
                     <select value={urinalysisForm.glucose} onChange={e => setUrinalysisForm(v => ({...v, glucose: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '±', '1＋', '2＋', '3＋', '4＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">蛋白質</label>
                     <select value={urinalysisForm.protein} onChange={e => setUrinalysisForm(v => ({...v, protein: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '±', '1＋', '2＋', '3＋', '4＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">ビリルビン</label>
                     <select value={urinalysisForm.bilirubin} onChange={e => setUrinalysisForm(v => ({...v, bilirubin: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '1＋', '2＋', '3＋', '4＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">ウロビリノーゲン</label>
                     <select value={urinalysisForm.urobilinogen} onChange={e => setUrinalysisForm(v => ({...v, urobilinogen: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '1＋', '2＋', '3＋', '4＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">pH</label>
                     <select value={urinalysisForm.ph} onChange={e => setUrinalysisForm(v => ({...v, ph: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['5', '6', '7', '8', '9'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">比重</label>
                     <select value={urinalysisForm.specificGravity} onChange={e => setUrinalysisForm(v => ({...v, specificGravity: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['1.000', '1.005', '1.010', '1.015', '1.020', '1.025', '1.030'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">潜血</label>
                     <select value={urinalysisForm.occultBlood} onChange={e => setUrinalysisForm(v => ({...v, occultBlood: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '±', '1＋', '2＋', '3＋', '4＋', '非1', '非2'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">ケトン体</label>
                     <select value={urinalysisForm.ketone} onChange={e => setUrinalysisForm(v => ({...v, ketone: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '±', '1＋', '2＋', '3＋', '4＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">亜硝酸塩</label>
                     <select value={urinalysisForm.nitrite} onChange={e => setUrinalysisForm(v => ({...v, nitrite: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '1＋', '2＋'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 block mb-1">白血球</label>
                     <select value={urinalysisForm.leukocytes} onChange={e => setUrinalysisForm(v => ({...v, leukocytes: e.target.value}))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:border-blue-500 focus:outline-none bg-white">
                        {['ー', '25', '75', '250', '500'].map(o => <option key={o} value={o}>{o}</option>)}
                     </select>
                   </div>
                 </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-2 justify-end">
              <button type="button" onClick={() => setModalState({ type: null, entryId: null })} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition">キャンセル</button>
              <button 
                type="button"
                onClick={() => {
                  if (modalState.type === 'vitals') submitVitals();
                  if (modalState.type === 'blood') submitBlood();
                  if (modalState.type === 'iv') submitIv();
                  if (modalState.type === 'vaccine') submitVaccine();
                  if (modalState.type === 'urinalysis') submitUrinalysis();
                }} 
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
