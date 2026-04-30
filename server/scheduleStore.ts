import { promises as fs } from 'fs';
import path from 'path';
import type { Person, TimeSlot, AssignmentMap, PersonWorkStat } from '../src/types';

const dataDir = path.join(process.cwd(), 'server', 'data');

export interface PersistedSchedule {
  month: string; // YYYY-MM
  people: Person[];
  timeSlots: TimeSlot[];
  assignments: AssignmentMap;
  stats: PersonWorkStat[];
  updatedAt: string;
}

const fileForMonth = (month: string) => path.join(dataDir, `${month}.json`);

export async function saveSchedule(payload: PersistedSchedule) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(fileForMonth(payload.month), JSON.stringify(payload, null, 2), 'utf-8');
}

export async function loadSchedule(month: string): Promise<PersistedSchedule | null> {
  try {
    const raw = await fs.readFile(fileForMonth(month), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listMonths(): Promise<string[]> {
  try {
    const files = await fs.readdir(dataDir);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json',''));
  } catch {
    return [];
  }
}
