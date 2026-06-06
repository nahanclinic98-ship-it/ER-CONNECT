export type LocationId =
  | 'bed-1' // 診察室 (一番奥右)
  | 'bed-2' // 診察室の左隣
  | 'bed-3' // レントゲン室 (向かい)
  | 'bed-4' // 操作室 (手前)
  | 'wait-1' // 待合室枠1
  | 'wait-2' // 待合室枠2
  | 'wait-3'; // 待合室枠3

export type ArrivalMethod = 'ウォークイン' | '車いす' | '救急搬送' | '';
export type CompanionType = '単独' | '配偶者' | '父' | '母' | 'その他' | '';

export interface ProgressEntry {
  id: string;
  time: string;
  text: string;
}

export interface Vitals {
  temp: string;
  bpSys: string;
  bpDia: string;
  pr: string;
  spo2: string;
  rr: string;
  jcs: string;
}

export interface Patient {
  id: string;
  chiefComplaint: string;
  locationId: LocationId;
  interviewRecord: string; // 問診記録
  progressEntries: ProgressEntry[];  // 経過記録
  vitals: Vitals;
  admittedAt: number;
  nurseInCharge: string;
  arrivalMethod: ArrivalMethod;
  companion: CompanionType;
  companionOtherText: string;
}
