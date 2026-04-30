import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Attendance } from '../types';

const AttendancePage = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance');
      const payload = res.data.data || res.data;
      setAttendance(payload.attendance || payload);
      // Check if currently clocked in
      const active = (payload.attendance || payload).find((a: any) => !a.clockOut);
      setClockedIn(!!active);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleClockIn = async () => {
    setClocking(true);
    try {
      await api.post('/attendance/clock-in', {});
      toast.success('Clocked in successfully');
      setClockedIn(true);
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      await api.post('/attendance/clock-out', {});
      toast.success('Clocked out successfully');
      setClockedIn(false);
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setClocking(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Attendance</h1>

      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {clockedIn ? '✓ Currently Clocked In' : 'Not Clocked In'}
            </h2>
            <p className="text-gray-600">Click the button to clock {clockedIn ? 'out' : 'in'}</p>
          </div>
          {clockedIn ? (
            <button onClick={handleClockOut} className="btn btn-danger" disabled={clocking}>
              {clocking ? 'Clocking Out...' : 'Clock Out'}
            </button>
          ) : (
            <button onClick={handleClockIn} className="btn btn-primary" disabled={clocking}>
              {clocking ? 'Clocking In...' : 'Clock In'}
            </button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attendance History</h2>

        {loading && <p>Loading attendance records...</p>}

        {!loading && attendance.length === 0 && <p className="text-gray-600">No attendance records</p>}

        {!loading && attendance.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Clock In</th>
                  <th className="px-4 py-2 text-left">Clock Out</th>
                  <th className="px-4 py-2 text-left">Total Hours</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3">{new Date(record.clockIn.time).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(record.clockIn.time).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">{record.clockOut ? new Date(record.clockOut.time).toLocaleTimeString() : '—'}</td>
                    <td className="px-4 py-3">{record.totalHours?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm ${record.status === 'present' ? 'bg-green-100' : record.status === 'late' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                        {record.status}
                      </span>
                    </td>
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

export default AttendancePage;
