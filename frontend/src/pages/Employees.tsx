import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingButton from '../components/LoadingButton';
import toast from 'react-hot-toast';
import { Employee } from '../types';
import socketUtil from '../utils/socket';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invite, setInvite] = useState({ email: '', firstName: '', lastName: '', role: 'employee' });

  useEffect(() => {
    let isMounted = true;

    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees');
        // API returns { data: [...] } or { data: { data: [...] } } depending on backend
        const payload = res.data.data || res.data;
        if (isMounted) {
          setEmployees(Array.isArray(payload) ? payload : payload.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load employees');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    let s: any = null;
    fetchEmployees();
    try {
      s = socketUtil.getSocket() || socketUtil.initSocket();
      if (s) {
        s.on('attendance:clock-in', (payload: any) => {
          setActiveMap((m) => ({ ...m, [String(payload.employeeId)]: true }));
        });
        s.on('attendance:clock-out', (payload: any) => {
          setActiveMap((m) => ({ ...m, [String(payload.employeeId)]: false }));
        });
        s.on('attendance:updated', (payload: any) => {
          if (typeof payload.isClockedIn === 'boolean') {
            setActiveMap((m) => ({ ...m, [String(payload.employeeId)]: payload.isClockedIn }));
          }
        });
      }
    } catch (e) {
      // ignore socket init errors
    }

    const loadInitialActiveEmployees = async () => {
      try {
        const response = await api.get('/attendance/active');
        const activeAttendance = response.data?.data?.activeAttendance || [];
        if (!isMounted) return;

        const nextMap: Record<string, boolean> = {};
        activeAttendance.forEach((record: any) => {
          const employeeId = record.employee?.id || record.employee?._id || record.employee;
          if (employeeId) nextMap[String(employeeId)] = true;
        });
        setActiveMap(nextMap);
      } catch (error) {
        // fall back to live socket updates only
      }
    };

    loadInitialActiveEmployees();

    return () => {
      isMounted = false;
      if (s) {
        s.off && s.off('attendance:clock-in');
        s.off && s.off('attendance:clock-out');
        s.off && s.off('attendance:updated');
      }
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Employees</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => navigate('/dashboard')} className="btn">← Back to Dashboard</button>
        <button onClick={() => navigate('/schedule')} className="btn">View Schedule</button>
        <button onClick={() => setShowInviteForm((s) => !s)} className="btn btn-primary">{showInviteForm ? 'Cancel' : 'Invite Employee'}</button>
      </div>

      {showInviteForm && (
        <div className="card p-4 mb-4 max-w-md">
          <div className="grid grid-cols-1 gap-2">
            <input placeholder="Email" value={invite.email} onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} className="px-3 py-2 border rounded" />
            <input placeholder="First name" value={invite.firstName} onChange={(e) => setInvite((i) => ({ ...i, firstName: e.target.value }))} className="px-3 py-2 border rounded" />
            <input placeholder="Last name" value={invite.lastName} onChange={(e) => setInvite((i) => ({ ...i, lastName: e.target.value }))} className="px-3 py-2 border rounded" />
            <select value={invite.role} onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value }))} className="px-3 py-2 border rounded">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <LoadingButton
                onClick={async () => {
                  if (!invite.email) return toast.error('Email is required');
                  setInviteLoading(true);
                  try {
                    await api.post('/employees', invite);
                    toast.success('Invitation sent / employee created');
                    setInvite({ email: '', firstName: '', lastName: '', role: 'employee' });
                    setShowInviteForm(false);
                    // refresh list
                    const res = await api.get('/employees');
                    const payload = res.data.data || res.data;
                    setEmployees(Array.isArray(payload) ? payload : payload.data || []);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to invite employee');
                  } finally {
                    setInviteLoading(false);
                  }
                }}
                className="btn btn-primary"
                loading={inviteLoading}
              >
                Send Invite
              </LoadingButton>
              <button onClick={() => setShowInviteForm(false)} className="btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${activeMap[emp.id] ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{emp.user?.firstName} {emp.user?.lastName}</span>
                      </div>
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
