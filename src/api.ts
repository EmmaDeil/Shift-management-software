import type { PersistedSchedule } from '../server/scheduleStore';

export interface ScheduleSummary {
  months: string[];
}

const API_BASE = '/api';

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getHealth() {
  return http<{ ok: boolean; time: string }>(`/health`);
}

export async function listMonths(): Promise<string[]> {
  const data = await http<ScheduleSummary>('/months');
  return data.months;
}

export async function loadSchedule(month: string): Promise<PersistedSchedule | null> {
  try {
    return await http<PersistedSchedule>(`/schedule/${month}`);
  } catch (e) {
    if (e instanceof Error && /404/.test(e.message)) return null;
    throw e;
  }
}

export async function saveSchedule(payload: Omit<PersistedSchedule,'updatedAt'>) {
  return http<{ saved: boolean; month: string }>(`/schedule/${payload.month}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
