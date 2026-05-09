import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Leave } from '../types';
import LoadingButton from '../components/LoadingButton';

const Leaves = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'vacation', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      const payload = res.data.data || res.data;
      setLeaves(payload.leaves || payload);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) return toast.error('Select start and end dates');
    setCreating(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave request submitted');
      setForm({ type: 'vacation', startDate: '', endDate: '', reason: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create leave');
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading((s) => ({ ...s, [id]: 'approve' }));
      await api.post(`/leaves/${id}/approve`, {});
      toast.success('Leave approved');
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading((s) => ({ ...s, [id]: 'reject' }));
      await api.post(`/leaves/${id}/reject`, {});
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Requests</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Request Leave'}
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => navigate('/dashboard')} className="btn">← Back to Dashboard</button>
        <button onClick={() => navigate('/schedule')} className="btn">View Schedule</button>
        <button onClick={() => navigate('/attendance')} className="btn">Attendance</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 max-w-2xl">
          <select name="type" value={form.type} onChange={handleChange} className="mb-4 block w-full">
            <option value="vacation">Vacation</option>
            <option value="sick">Sick</option>
            <option value="personal">Personal</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="mb-4 block w-full" />
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="mb-4 block w-full" />
          <textarea name="reason" placeholder="Reason" value={form.reason} onChange={handleChange} className="mb-4 block w-full h-20"></textarea>

          <LoadingButton onClick={handleSubmit} className="btn btn-primary" loading={creating}>
            Submit Request
          </LoadingButton>
        </div>
      )}

      <div className="card p-6">
        {loading && <p>Loading leaves...</p>}

        {!loading && leaves.length === 0 && <p className="text-gray-600">No leave requests</p>}

        {!loading && leaves.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Employee</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Start Date</th>
                  <th className="px-4 py-2 text-left">End Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  {user?.role !== 'employee' && <th className="px-4 py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leaves.map((leave) => {
                  const leaveKey = leave.id;

                  return (
                    <tr key={leaveKey}>
                      <td className="px-4 py-3">{leave.employee?.user?.firstName} {leave.employee?.user?.lastName}</td>
                      <td className="px-4 py-3">{leave.type}</td>
                      <td className="px-4 py-3">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-sm ${leave.status === 'pending' ? 'bg-yellow-100' : leave.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {leave.status}
                        </span>
                      </td>
                      {user?.role !== 'employee' && leave.status === 'pending' && (
                        <td className="px-4 py-3 space-x-2">
                          <LoadingButton
                            onClick={() => handleApprove(leaveKey)}
                            className="btn btn-sm"
                            loading={actionLoading[leaveKey] === 'approve'}
                          >
                            Approve
                          </LoadingButton>

                          <LoadingButton
                            onClick={() => handleReject(leaveKey)}
                            className="btn btn-sm"
                            loading={actionLoading[leaveKey] === 'reject'}
                          >
                            Reject
                          </LoadingButton>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaves;
