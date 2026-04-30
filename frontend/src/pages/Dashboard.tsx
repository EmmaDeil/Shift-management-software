import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Shift } from '../types';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayShifts: 0,
    currentlyClockedIn: 0,
    pendingLeaves: 0,
    weekShifts: 0,
    weekAttendance: 0,
    upcomingShifts: [] as Shift[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        const data = res.data.data || res.data;
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Today's Shifts</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.todayShifts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active shifts</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.currentlyClockedIn}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Currently clocked in</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.pendingLeaves}</p>
          <p className="text-sm text-orange-600 mt-1">Leave approvals needed</p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Employees</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.totalEmployees}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active staff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Shifts (Next 7 Days)</h2>
          <div className="space-y-4">
            {loading ? (
              <p>Loading...</p>
            ) : stats.upcomingShifts?.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No upcoming shifts</p>
            ) : (
              stats.upcomingShifts?.slice(0, 5).map((shift) => (
                <div key={shift.id} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">{shift.title}</p>
                    <p className="text-sm text-gray-600">{shift.employee?.user?.firstName} {shift.employee?.user?.lastName}</p>
                  </div>
                  <p className="text-sm text-gray-600">{new Date(shift.startTime as any).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">This Week's Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Shifts</span>
              <span className="font-semibold">{loading ? '...' : stats.weekShifts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Attendance Records</span>
              <span className="font-semibold">{loading ? '...' : stats.weekAttendance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Attendance Rate</span>
              <span className="font-semibold text-green-600">{loading ? '...' : stats.weekShifts > 0 ? ((stats.weekAttendance / stats.weekShifts) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
