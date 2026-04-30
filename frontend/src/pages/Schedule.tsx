import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shift } from '../types';
import { useAuth } from '../context/AuthContext';
import ReassignShiftModal from '../components/ReassignShiftModal';
import toast from 'react-hot-toast';

const formatDate = (iso?: string | Date) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const Schedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shifts');
      const payload = res.data.data || res.data;
      const shiftsList = payload.shifts || payload.data || [];
      setShifts(Array.isArray(shiftsList) ? shiftsList : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const handleReassignClick = (shift: Shift) => {
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      toast.error('Only managers and admins can reassign shifts');
      return;
    }
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleReassignSuccess = () => {
    toast.success('Shift reassigned successfully!');
    fetchShifts();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Schedule</h1>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button onClick={() => navigate('/dashboard')} className="btn">← Back to Dashboard</button>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => navigate('/shift-overview')} className="btn btn-secondary">
            View All Shifts
          </button>
        )}
        <button onClick={() => navigate('/swaps')} className="btn">Request Swap</button>
        <button onClick={() => navigate('/attendance')} className="btn">Clock In/Out</button>
      </div>

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
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <th className="px-4 py-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.title || 'Shift'}</td>
                    <td className="px-4 py-3">{s.employee?.user?.firstName} {s.employee?.user?.lastName}</td>
                    <td className="px-4 py-3">{formatDate(s.startTime as any)}</td>
                    <td className="px-4 py-3">{formatDate(s.endTime as any)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'completed' ? 'bg-green-100 text-green-800' :
                        s.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        s.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleReassignClick(s)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          Reassign
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReassignShiftModal
        isOpen={isModalOpen}
        shift={selectedShift}
        onClose={handleModalClose}
        onSuccess={handleReassignSuccess}
      />
    </div>
  );
};

export default Schedule;
