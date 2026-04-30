import { useCallback, useMemo, useState, useEffect } from 'react';
import type { AssignmentMap, Person, ScheduleState, TimeSlot, PersonWorkStat, ExportPayload, OverHoursConfig } from '../types';
import { computeStats } from '../logic/stats';
import { loadSchedule as apiLoad, saveSchedule as apiSave, listMonths as apiListMonths } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utility helpers
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const formatDate = (y: number, m: number, day: number) => `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const toDate = (isoDate: string) => new Date(isoDate + 'T00:00:00');
const isWeekend = (isoDate: string) => {
  const d = toDate(isoDate).getDay();
  return d === 0 || d === 6;
};
const startOfISOWeek = (d: Date) => {
  const day = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0,0,0,0);
  return monday;
};
const weekKeyOf = (isoDate: string) => {
  const d = toDate(isoDate);
  const monday = startOfISOWeek(d);
  return monday.toISOString().slice(0,10);
};

export interface UseScheduleOptions {
  initialPeople?: string[];
  initialTimeSlots?: { id: string; label: string }[];
  overHoursConfig?: OverHoursConfig;
  companyName?: string;
}

// Lightweight id generator to avoid external dependency
const genId = () => Math.random().toString(36).slice(2, 10);
const basePalette = ['#2563eb','#dc2626','#16a34a','#7c3aed','#ea580c','#0891b2','#db2777','#4d7c0f','#9333ea','#047857'];
let globalColorIndex = 0;
const nextColor = () => basePalette[globalColorIndex++ % basePalette.length];


export const useSchedule = (options: UseScheduleOptions = {}) => {
  const [state, setState] = useState<ScheduleState>(() => {
  const people: Person[] = (options.initialPeople || []).map(name => ({ id: genId(), name, active: true, color: nextColor() }));
    const timeSlots: TimeSlot[] = (options.initialTimeSlots || [
      { id: 'morning', label: 'Morning' },
      { id: 'afternoon', label: 'Afternoon' },
    ]);
    return {
      people,
      timeSlots,
      assignments: {},
      currentMonth: startOfMonth(new Date()),
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [config, setConfig] = useState({
    shiftHours: options.overHoursConfig?.shiftHours ?? 8,
    maxDayHours: 8,
    maxWeekHours: 40,
    maxMonthHours: 160,
    excludeWeekends: false,
    companyName: options.companyName || 'Company',
    logoDataUrl: null as string | null,
  });
  const updateConfig = (patch: Partial<typeof config>) => setConfig(c => ({ ...c, ...patch }));

  const setCurrentMonth = (date: Date) => setState(s => ({ ...s, currentMonth: startOfMonth(date) }));
  const nextMonth = () => setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1));

  const addPeopleBulk = (names: string) => {
    const list = names.split(/\n|,/).map(n => n.trim()).filter(Boolean);
    if (!list.length) return;
    setState(s => ({
      ...s,
      people: [...s.people, ...list.map((name, i) => ({ id: genId(), name, active: true, color: basePalette[(s.people.length + i) % basePalette.length] }))]
    }));
  };

  const togglePersonActive = (id: string) => {
    setState(s => ({
      ...s,
      people: s.people.map(p => p.id === id ? { ...p, active: !p.active } : p)
    }));
  };

  const addTimeSlot = (id: string, label: string) => {
    if (!id || !label) return;
    setState(s => ({ ...s, timeSlots: [...s.timeSlots, { id, label }] }));
  };

  const removeTimeSlot = (id: string) => {
    setState(s => {
      const assignments = { ...s.assignments };
      Object.keys(assignments).forEach(k => { if (k.endsWith(`_${id}`)) delete assignments[k]; });
      return { ...s, timeSlots: s.timeSlots.filter(ts => ts.id !== id), assignments };
    });
  };

  const updateTimeSlot = (id: string, next: { id?: string; label?: string }): boolean => {
    const newId = next.id?.trim();
    const newLabel = next.label?.trim();
    // Validate uniqueness if id changes
    if (newId && newId !== id) {
      if (state.timeSlots.some(ts => ts.id === newId)) {
        return false; // duplicate id, reject
      }
    }
    setState(s => {
      const timeSlots = s.timeSlots.map(ts => ts.id === id ? { id: newId || ts.id, label: newLabel ?? ts.label } : ts);
      let assignments = s.assignments;
      if (newId && newId !== id) {
        // migrate assignment keys from _oldId to _newId
        const nextAssignments: typeof assignments = { ...assignments };
        for (const [key, val] of Object.entries(assignments)) {
          if (!key.endsWith(`_${id}`)) continue;
          const dateKey = key.slice(0, key.length - (`_${id}`).length);
          const targetKey = `${dateKey}_${newId}`;
          if (!(targetKey in nextAssignments)) {
            nextAssignments[targetKey] = val;
          }
          delete nextAssignments[key];
        }
        assignments = nextAssignments;
      }
      return { ...s, timeSlots, assignments };
    });
    return true;
  };

  const assignPerson = (date: string, slotId: string, personId: string | null) => {
    const key = `${date}_${slotId}`;
    setState(s => ({
      ...s,
      assignments: { ...s.assignments, [key]: personId }
    }));
  };

  const autoAssign = useCallback(() => {
    setState(s => {
      const active = s.people.filter(p => p.active);
      if (!active.length) return s;
      const totalDays = daysInMonth(s.currentMonth);
      const assignments: AssignmentMap = { ...s.assignments };
      const shiftHours = config.shiftHours;
      // Pre-count existing hours per person
      const dayHours: Record<string, Record<string, number>> = {};
      const weekHours: Record<string, Record<string, number>> = {};
      const monthHours: Record<string, number> = {};
      for (const [k, personId] of Object.entries(assignments)) {
        if (!personId) continue;
        const [date, slotId] = k.split('_');
        // only count known slots
        if (!slotId) continue;
        dayHours[personId] = dayHours[personId] || {};
        dayHours[personId][date] = (dayHours[personId][date] || 0) + shiftHours;
        const wk = weekKeyOf(date);
        weekHours[personId] = weekHours[personId] || {};
        weekHours[personId][wk] = (weekHours[personId][wk] || 0) + shiftHours;
        monthHours[personId] = (monthHours[personId] || 0) + shiftHours;
      }
      let round = 0;
      for (let day = 1; day <= totalDays; day++) {
        const date = formatDate(s.currentMonth.getFullYear(), s.currentMonth.getMonth(), day);
        if (config.excludeWeekends && isWeekend(date)) continue;
        for (const slot of s.timeSlots) {
          const key = `${date}_${slot.id}`;
          if (assignments[key]) continue; // only fill empty
          // find next eligible person
          for (let offset = 0; offset < active.length; offset++) {
            const idx = (round + offset) % active.length;
            const p = active[idx];
            const dH = ((dayHours[p.id] || {})[date] || 0);
            const wK = weekKeyOf(date);
            const wH = ((weekHours[p.id] || {})[wK] || 0);
            const mH = (monthHours[p.id] || 0);
            if (dH + shiftHours > config.maxDayHours) continue;
            if (wH + shiftHours > config.maxWeekHours) continue;
            if (mH + shiftHours > config.maxMonthHours) continue;
            // assign
            assignments[key] = p.id;
            dayHours[p.id] = dayHours[p.id] || {};
            dayHours[p.id][date] = dH + shiftHours;
            weekHours[p.id] = weekHours[p.id] || {};
            weekHours[p.id][wK] = wH + shiftHours;
            monthHours[p.id] = mH + shiftHours;
            round = idx + 1;
            break;
          }
        }
      }
      return { ...s, assignments };
    });
  }, [config.excludeWeekends, config.maxDayHours, config.maxWeekHours, config.maxMonthHours, config.shiftHours]);

  const clearAssignments = () => setState(s => ({ ...s, assignments: {} }));

  const days = useMemo(() => {
    const total = daysInMonth(state.currentMonth);
    return Array.from({ length: total }, (_, i) => formatDate(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), i + 1));
  }, [state.currentMonth]);

  // Derived statistics
  const stats: PersonWorkStat[] = useMemo(() => {
    return computeStats(state.people, state.assignments, config.shiftHours, config.maxMonthHours);
  }, [state.assignments, state.people, config.shiftHours, config.maxMonthHours]);

  const buildExportPayload = (): ExportPayload => {
    return {
      month: `${state.currentMonth.getFullYear()}-${String(state.currentMonth.getMonth()+1).padStart(2,'0')}`,
      timeSlots: state.timeSlots,
      people: state.people,
      assignments: state.assignments,
      stats,
      generatedAt: new Date().toISOString(),
    };
  };

  const exportCSV = (): string => {
    const payload = buildExportPayload();
    const header = ['Person','Shifts','Hours','OverHours'];
    const rows = payload.stats.map(s => [s.name, s.shifts, s.hours, s.overHours].join(','));
    return [header.join(','), ...rows].join('\n');
  };

  const exportPDF = (): ArrayBuffer => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const payload = buildExportPayload();
    const generatedAt = new Date().toLocaleString();
    const title = `Schedule ${payload.month}`;
    doc.setProperties({ title, subject: 'Team Schedule', author: config.companyName });
    const header = () => {
      doc.setFontSize(12);
      const leftX = 14;
      let textX = leftX;
      // Render logo if provided
      if (config.logoDataUrl) {
        try {
          // Try to infer image format from data URL prefix
          const fmt: 'PNG' | 'JPEG' = config.logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          // Draw at small height, maintain width via auto aspect
          doc.addImage(config.logoDataUrl, fmt, leftX, 6, 18, 0);
          textX = leftX + 22;
        } catch {
          // ignore logo errors
        }
      }
      doc.text(config.companyName, textX, 12);
      doc.setFontSize(16);
      doc.text(title, textX, 20);
    };
    const footer = (pageNumber: number, totalPages: number) => {
      doc.setFontSize(9);
  const rules = `Rules: shift=${config.shiftHours}h, max/day=${config.maxDayHours}h, max/week=${config.maxWeekHours}h, max/month=${config.maxMonthHours}h, weekends=${config.excludeWeekends ? 'excluded' : 'included'}`;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const y1 = pageHeight - 12;
      const y2 = pageHeight - 6;
      doc.text(`Generated: ${generatedAt}`, 14, y1);
      doc.text(rules, 14, y2);
      const pageLabel = `Page ${pageNumber} / ${totalPages}`;
      doc.text(pageLabel, pageWidth - 14 - doc.getTextWidth(pageLabel), y2);
    };
    const body = payload.stats.map(s => [s.name, s.shifts.toString(), s.hours.toString(), s.overHours ? s.overHours.toString() : '-']);
    autoTable(doc, {
      head: [['Person','Shifts','Hours','OverHours']],
      body,
      margin: { top: 28, bottom: 22 },
      startY: 28,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [33,150,243] },
      didDrawPage: () => {
        header();
        // jsPDF 2.x provides getNumberOfPages and getCurrentPage
        const totalPages = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages?.() ?? 1;
        const currentPage = (doc as unknown as { getCurrentPage: () => number }).getCurrentPage?.() ?? totalPages;
        footer(currentPage, totalPages);
      },
    });

    // Build schedule table: Dates x TimeSlots with assigned names
    const dates: string[] = (() => {
      const total = daysInMonth(state.currentMonth);
      const all = Array.from({ length: total }, (_, i) => formatDate(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), i + 1));
      return config.excludeWeekends ? all.filter(d => !isWeekend(d)) : all;
    })();
    const slotHeaders = state.timeSlots.map(ts => ts.label);
    const scheduleHead = [['Date', ...slotHeaders]];
    const scheduleBody = dates.map(d => {
      const row = [d];
      for (const slot of state.timeSlots) {
        const key = `${d}_${slot.id}`;
        const pid = state.assignments[key];
        const name = state.people.find(p => p.id === pid)?.name || '';
        row.push(name);
      }
      return row;
    });
  type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };
  const docAT = doc as DocWithAutoTable;
  const afterStatsY = docAT.lastAutoTable ? docAT.lastAutoTable.finalY + 8 : 28;
    autoTable(doc, {
      head: scheduleHead,
      body: scheduleBody,
      startY: afterStatsY,
      margin: { top: 28, bottom: 22 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [76,175,80] },
      didDrawPage: () => {
        header();
        const totalPages = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages?.() ?? 1;
        const currentPage = (doc as unknown as { getCurrentPage: () => number }).getCurrentPage?.() ?? totalPages;
        footer(currentPage, totalPages);
      },
    });
    return doc.output('arraybuffer') as ArrayBuffer;
  };

  const saveCurrentMonth = async () => {
    setIsSaving(true);
    try {
      const payload = buildExportPayload();
      try {
        await apiSave({
          month: payload.month,
          people: payload.people,
          timeSlots: payload.timeSlots,
          assignments: payload.assignments,
          stats,
        });
      } catch (e) {
        // offline fallback: store in localStorage
        try { localStorage.setItem(`schedule_${payload.month}`, JSON.stringify(payload)); } catch {/* ignore */}
        throw e; // rethrow so UI can show error if desired
      }
      // also store a local cache copy for fast load
      try { localStorage.setItem(`schedule_${payload.month}`, JSON.stringify(payload)); } catch {/* ignore */}
  setLastSavedAt(new Date().toISOString());
  try { setMonths(await apiListMonths()); } catch { /* ignore */ }
    } finally {
      setIsSaving(false);
    }
  };

  const loadMonth = async (month: string) => {
    setIsLoading(true);
    try {
      const data = await apiLoad(month);
      if (!data) {
        // attempt local cache
        try {
          const raw = localStorage.getItem(`schedule_${month}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            setState(s => ({
              ...s,
              people: parsed.people || [],
              timeSlots: parsed.timeSlots || [],
              assignments: parsed.assignments || {},
              currentMonth: startOfMonth(new Date(`${month}-01`)),
            }));
            // ensure months includes this month
            setMonths(m => Array.from(new Set([month, ...m])));
            return true;
          }
        } catch {/* ignore */}
        // No data found anywhere: still move the calendar to that month with empty assignments
        setState(s => ({
          ...s,
          assignments: {},
          currentMonth: startOfMonth(new Date(`${month}-01`)),
        }));
        setMonths(m => Array.from(new Set([month, ...m])));
        return true;
      }
      // Merge into state
      setState(s => ({
        ...s,
        people: data.people,
        timeSlots: data.timeSlots,
        assignments: data.assignments,
        currentMonth: startOfMonth(new Date(`${month}-01`)),
      }));
      setMonths(m => Array.from(new Set([month, ...m])));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const collectLocalMonths = () => {
    const list: string[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || '';
          if (k.startsWith('schedule_')) {
            const m = k.replace('schedule_', '');
            if (/^\d{4}-\d{2}$/.test(m)) list.push(m);
          }
        }
      }
    } catch { /* ignore */ }
    return list;
  };

  const mergeMonths = (a: string[], b: string[]) => {
    const set = new Set<string>([...a, ...b]);
    return Array.from(set).sort().reverse();
  };

  useEffect(() => {
    (async () => {
      try {
        const apiMonths = await apiListMonths();
        setMonths(mergeMonths(apiMonths, collectLocalMonths()));
      } catch {
        setMonths(mergeMonths([], collectLocalMonths()));
      }
    })();
  }, []);

  return {
    ...state,
    days,
    config,
    updateConfig,
    addPeopleBulk,
    togglePersonActive,
    addTimeSlot,
    removeTimeSlot,
  updateTimeSlot,
    assignPerson,
    autoAssign,
    clearAssignments,
    nextMonth,
    prevMonth,
    stats,
    exportCSV,
  exportPDF,
    saveCurrentMonth,
    loadMonth,
    isSaving,
    isLoading,
    lastSavedAt,
    months,
  };
};
