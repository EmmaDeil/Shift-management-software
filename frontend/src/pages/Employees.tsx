import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Employee } from '../types';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees');
        // API returns { data: [...] } or { data: { data: [...] } } depending on backend
        const payload = res.data.data || res.data;
        setEmployees(Array.isArray(payload) ? payload : payload.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Employees</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => navigate('/dashboard')} className="btn">← Back to Dashboard</button>
        <button onClick={() => navigate('/schedule')} className="btn">View Schedule</button>
      </div>

      <div className="card p-6">
        {loading && <p>Loading employees...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3">
                      {emp.user?.firstName} {emp.user?.lastName}
                    </td>
                    <td className="px-4 py-3">{emp.user?.email}</td>
                    <td className="px-4 py-3">{emp.user?.position || '—'}</td>
                    <td className="px-4 py-3">{emp.user?.phone || '—'}</td>
                    <td className="px-4 py-3">{emp.status}</td>
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

export default Employees;
