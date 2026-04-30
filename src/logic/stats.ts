// Local minimal type copies to keep this module framework-agnostic for testing
interface Person { id: string; name: string; active: boolean; color: string; }
interface PersonWorkStat { personId: string; name: string; shifts: number; hours: number; overHours: number; }
interface AssignmentMap { [k: string]: string | null | undefined }

export function computeStats(people: Person[], assignments: AssignmentMap, shiftHours: number, monthlyHourTarget?: number): PersonWorkStat[] {
  const counter: Record<string, number> = {};
  Object.values(assignments).forEach(personId => {
    if (personId) counter[personId] = (counter[personId] || 0) + 1;
  });
  const totalShifts = Object.keys(assignments).length || 1;
  const avgShifts = totalShifts / (people.length || 1);
  return people.map(p => {
    const shifts = counter[p.id] || 0;
    const hours = shifts * shiftHours;
    let overHours = 0;
    if (monthlyHourTarget) {
      overHours = hours > monthlyHourTarget ? hours - monthlyHourTarget : 0;
    } else {
      overHours = shifts > avgShifts ? (shifts - avgShifts) * shiftHours : 0;
    }
    return { personId: p.id, name: p.name, shifts, hours, overHours };
  });
}