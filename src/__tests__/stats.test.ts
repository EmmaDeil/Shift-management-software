import { describe, it, expect } from 'vitest';
import { computeStats } from '../logic/stats';

const people = [
  { id: 'a', name: 'Alice', active: true, color: '#000' },
  { id: 'b', name: 'Bob', active: true, color: '#111' },
];

describe('computeStats', () => {
  it('computes hours and overHours (average mode)', () => {
    const assignments = {
      '2025-01-01_morning': 'a',
      '2025-01-01_afternoon': 'a',
      '2025-01-02_morning': 'b',
    } as Record<string,string>;
    const stats = computeStats(people, assignments, 8);
    const alice = stats.find(s => s.personId === 'a')!;
    const bob = stats.find(s => s.personId === 'b')!;
    expect(alice.hours).toBe(16);
    expect(bob.hours).toBe(8);
  });

  it('uses monthlyHourTarget when provided', () => {
    const assignments = { '2025-01-01_morning': 'a' } as Record<string,string>;
    const stats = computeStats(people, assignments, 8, 4); // target 4 hours
    const alice = stats.find(s => s.personId === 'a')!;
    expect(alice.overHours).toBe(4); // 8 - 4
  });
});
