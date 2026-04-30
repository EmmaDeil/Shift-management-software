export interface Person {
  id: string;
  name: string;
  active: boolean;
  color: string; // hex or css color string
}

export interface TimeSlot {
  id: string;          // e.g. 'morning', 'afternoon'
  label: string;       // Display label
}

export interface AssignmentKey {
  date: string;        // YYYY-MM-DD
  slotId: string;      // TimeSlot.id
}

export interface AssignmentMap {
  [date_slot: string]: string | null; // key `${date}_${slotId}` => personId
}

export interface ScheduleState {
  people: Person[];
  timeSlots: TimeSlot[];
  assignments: AssignmentMap;
  currentMonth: Date; // normalized to first day of month
}

export interface PersonWorkStat {
  personId: string;
  name: string;
  shifts: number; // count of assigned slots
  hours: number;  // shifts * standardShiftHours
  overHours: number; // hours above standard threshold (e.g., expectedHours)
}

export interface ExportPayload {
  month: string; // YYYY-MM
  timeSlots: TimeSlot[];
  people: Person[];
  assignments: AssignmentMap;
  stats: PersonWorkStat[];
  generatedAt: string;
}

export interface OverHoursConfig {
  shiftHours?: number;          // default 8
  monthlyHourTarget?: number;   // if provided, compare person hours to this instead of avg
}
