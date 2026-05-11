import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Shift } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingButton from '../components/LoadingButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManagement = user?.role === 'admin' || user?.role === 'manager';
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayShifts: 0,
    currentlyClockedIn: 0,
    pendingLeaves: 0,
    pendingSwaps: 0,
    weekShifts: 0,
    weekAttendance: 0,
    upcomingShifts: [] as Shift[],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isManagement) {
      setLoading(false);
      return;
    }

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
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [isManagement]);

  const StatCard = ({ title, value, color, onClick }: { title: string; value: number | string; color?: string; onClick?: () => void }) => (
    <div onClick={onClick} className={`card p-6 cursor-pointer hover:shadow-lg transition ${onClick ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{loading ? '...' : value}</p>
    </div>
  );

  if (!isManagement) {
    return (
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Workspace</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Your role controls access, but your account remains linked to the employee workflow.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium capitalize">
            {user?.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button onClick={() => navigate('/attendance')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-blue-600">Clock In / Out</p>
            <p className="text-sm text-gray-600 mt-1">Record today&apos;s attendance</p>
          </button>
          <button onClick={() => navigate('/schedule')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-green-600">My Schedule</p>
            <p className="text-sm text-gray-600 mt-1">View assigned shifts</p>
          </button>
          <button onClick={() => navigate('/leaves')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-orange-600">Request Leave</p>
            <p className="text-sm text-gray-600 mt-1">Submit time off requests</p>
          </button>
          <button onClick={() => navigate('/swaps')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-purple-600">Swap Shift</p>
            <p className="text-sm text-gray-600 mt-1">Coordinate coverage with coworkers</p>
          </button>
          <button onClick={() => navigate('/profile')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-gray-700 dark:text-gray-200">My Profile</p>
            <p className="text-sm text-gray-600 mt-1">Keep your employee record current</p>
          </button>
          <button onClick={() => navigate('/settings')} className="card p-5 text-left hover:shadow-lg transition">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Preferences</p>
            <p className="text-sm text-gray-600 mt-1">Theme, language, and notifications</p>
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Employee-linked access</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Admin and manager users still keep the same employee context, so scheduling, attendance, leave, and swap flows continue to work the same way.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Management overview with team and operations controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <LoadingButton className="btn" loading={exporting} onClick={async () => {
            setExporting(true);
            try {
              const res = await api.get('/analytics/dashboard');
              const data = res.data.data || res.data;
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dashboard-stats-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Failed to export stats');
            } finally {
              setExporting(false);
            }
          }}>
            Export Stats
          </LoadingButton>

          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium capitalize">
            {user?.role}
          </span>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard 
          title="Today's Shifts" 
          value={stats.todayShifts} 
          color="text-blue-600"
          onClick={() => navigate('/schedule')}
        />

        <StatCard 
          title="Clocked In" 
          value={stats.currentlyClockedIn} 
          color="text-green-600"
          onClick={() => navigate('/attendance')}
        />

        <StatCard 
          title="Pending Leaves" 
          value={stats.pendingLeaves} 
          color="text-orange-600"
          onClick={() => navigate('/leaves')}
        />

        <StatCard 
          title="Pending Swaps" 
          value={stats.pendingSwaps || 0} 
          color="text-purple-600"
          onClick={() => navigate('/swaps')}
        />

        <StatCard 
          title="Total Staff" 
          value={stats.totalEmployees} 
          color="text-gray-600"
          onClick={() => navigate('/employees')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Shifts (Next 7 Days)</h2>
            <button onClick={() => navigate('/schedule')} className="text-blue-600 text-sm hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p>Loading...</p>
            ) : stats.upcomingShifts?.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No upcoming shifts</p>
            ) : (
              stats.upcomingShifts?.slice(0, 5).map((shift) => (
                <div key={shift.id} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 cursor-pointer transition">
                  <div onClick={() => navigate('/schedule')}>
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">This Week's Performance</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded cursor-pointer hover:opacity-80" onClick={() => navigate('/schedule')}>
              <span className="font-medium">Total Shifts</span>
              <span className="text-2xl font-bold">{loading ? '...' : stats.weekShifts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded cursor-pointer hover:opacity-80" onClick={() => navigate('/attendance')}>
              <span className="font-medium">Attendance Records</span>
              <span className="text-2xl font-bold">{loading ? '...' : stats.weekAttendance}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded">
              <span className="font-medium">Attendance Rate</span>
              <span className="text-2xl font-bold text-purple-600">{loading ? '...' : stats.weekShifts > 0 ? ((stats.weekAttendance / stats.weekShifts) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/employees')} className="card p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-blue-600">👥 Team</p>
          <p className="text-xs text-gray-600">Employees</p>
        </button>
        <button onClick={() => navigate('/reports')} className="card p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-green-600">📊 Reports</p>
          <p className="text-xs text-gray-600">Analytics</p>
        </button>
        <button onClick={() => navigate('/schedule')} className="card p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-purple-600">🗓️ Schedule</p>
          <p className="text-xs text-gray-600">Planning</p>
        </button>
        <button onClick={() => navigate('/attendance')} className="card p-4 text-center hover:shadow-lg transition">
          <p className="font-semibold text-orange-600">⏱️ Attendance</p>
          <p className="text-xs text-gray-600">Time tracking</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
