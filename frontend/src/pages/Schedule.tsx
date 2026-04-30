import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Shift } from '../types';

const formatDate = (iso?: string | Date) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const Schedule = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/shifts');
        const payload = res.data.data || res.data;
        setShifts(Array.isArray(payload) ? payload : payload.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load shifts');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Schedule</h1>

      <div className="card p-6">
        {loading && <p>Loading schedule...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2">End</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.title || 'Shift'}</td>
                    <td className="px-4 py-3">{s.employee?.user?.firstName} {s.employee?.user?.lastName}</td>
                    <td className="px-4 py-3">{formatDate(s.startTime as any)}</td>
                    <td className="px-4 py-3">{formatDate(s.endTime as any)}</td>
                    <td className="px-4 py-3">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
