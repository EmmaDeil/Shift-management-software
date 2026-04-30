(async () => {
  const month = '2025-10';
  const payload = {
    month,
    people: [{ id: 'p1', name: 'Tester', active: true, color: '#000' }],
    timeSlots: [{ id: 'morning', label: 'Morning' }],
    assignments: { '2025-10-01_morning': 'p1' },
    stats: [{ personId: 'p1', name: 'Tester', shifts: 1, hours: 8, overHours: 0 }],
  };
  const res = await fetch(`http://localhost:4000/api/schedule/${month}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log('Status', res.status);
  const body = await res.json();
  console.log(body);
})();
