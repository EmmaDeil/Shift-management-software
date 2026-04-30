import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SwapRequest {
  id: string;
  requestedBy: { _id: string; user: { firstName: string; lastName: string; email: string } };
  requestedTo: { _id: string; user: { firstName: string; lastName: string; email: string } };
  shift: { _id: string; startTime: Date; endTime: Date; title: string };
  offeredShift?: { _id: string; startTime: Date; endTime: Date; title: string };
  status: 'pending' | 'accepted' | 'approved' | 'rejected';
  peerResponse?: string;
  managerResponse?: string;
  reason?: string;
  createdAt: Date;
}

const Swaps = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ shiftId: '', requestedToId: '', offeredShiftId: '', reason: '' });

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/swaps');
      const payload = res.data.data || res.data;
      setSwaps(payload.swaps || payload);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load swaps');
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts');
      const payload = res.data.data || res.data;
      setShifts(payload.shifts || payload);
    } catch (err: any) {
      console.error('Failed to load shifts');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      const payload = res.data.data || res.data;
      setEmployees(payload.users || payload);
    } catch (err: any) {
      console.error('Failed to load employees');
    }
  };

  useEffect(() => {
    fetchSwaps();
    fetchShifts();
    fetchEmployees();
    // Auto-refresh swaps every 30 seconds
    const interval = setInterval(fetchSwaps, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.shiftId || !form.requestedToId) return toast.error('Select shift and employee');
    setCreating(true);
    try {
      await api.post('/swaps', form);
      toast.success('Swap request submitted');
      setForm({ shiftId: '', requestedToId: '', offeredShiftId: '', reason: '' });
      setShowForm(false);
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create swap');
    } finally {
      setCreating(false);
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    try {
      await api.put(`/swaps/${id}/peer-response`, { accept });
      toast.success(accept ? 'Swap accepted' : 'Swap rejected');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await api.put(`/swaps/${id}/manager-review`, { approve });
      toast.success(approve ? 'Swap approved' : 'Swap rejected');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to review');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shift Swaps</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Request Swap'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 max-w-2xl">
          <select name="shiftId" value={form.shiftId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select your shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || 'Shift'} - {new Date(s.startTime).toLocaleString()}
              </option>
            ))}
          </select>

          <select name="requestedToId" value={form.requestedToId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select employee to swap with</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.user?.firstName} {e.user?.lastName}
              </option>
            ))}
          </select>

          <select name="offeredShiftId" value={form.offeredShiftId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select offered shift (optional)</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || 'Shift'} - {new Date(s.startTime).toLocaleString()}
              </option>
            ))}
          </select>

          <textarea name="reason" placeholder="Reason for swap" value={form.reason} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded h-20"></textarea>

          <button onClick={handleSubmit} className="btn btn-primary" disabled={creating}>
            {creating ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}

      <div className="card p-6">
        {loading && <p>Loading swaps...</p>}

        {!loading && swaps.length === 0 && <p className="text-gray-600">No swap requests</p>}

        {!loading && swaps.length > 0 && (
          <div className="space-y-4">
            {swaps.map((swap) => (
              <div key={swap.id} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {swap.requestedBy.user.firstName} {swap.requestedBy.user.lastName} → {swap.requestedTo.user.firstName} {swap.requestedTo.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{swap.reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(swap.status)}`}>
                    {swap.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">From Shift</p>
                    <p className="text-gray-600">{new Date(swap.shift.startTime).toLocaleString()}</p>
                  </div>
                  {swap.offeredShift && (
                    <div>
                      <p className="font-medium text-gray-700">To Shift</p>
                      <p className="text-gray-600">{new Date(swap.offeredShift.startTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Peer response (for requested employee) */}
                {swap.status === 'pending' && swap.requestedTo._id === (user?.id || (user as any)?._id) && (
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(swap.id, true)} className="btn btn-sm btn-primary">
                      Accept
                    </button>
                    <button onClick={() => handleRespond(swap.id, false)} className="btn btn-sm">
                      Reject
                    </button>
                  </div>
                )}

                {/* Manager review (for managers) */}
                {swap.status === 'accepted' && user?.role !== 'employee' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(swap.id, true)} className="btn btn-sm btn-primary">
                      Approve
                    </button>
                    <button onClick={() => handleApprove(swap.id, false)} className="btn btn-sm">
                      Reject
                    </button>
                  </div>
                )}

                {/* Status badges for responses */}
                {swap.peerResponse && (
                  <p className="text-sm mt-2 text-gray-600">
                    Peer response: <span className="font-medium">{swap.peerResponse}</span>
                  </p>
                )}
                {swap.managerResponse && (
                  <p className="text-sm text-gray-600">
                    Manager decision: <span className="font-medium">{swap.managerResponse}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick navigation to related pages */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/schedule')} className="card p-4 hover:bg-gray-100 cursor-pointer text-center">
          <p className="font-semibold">View Schedule</p>
        </button>
        <button onClick={() => navigate('/dashboard')} className="card p-4 hover:bg-gray-100 cursor-pointer text-center">
          <p className="font-semibold">Dashboard</p>
        </button>
        <button onClick={() => navigate('/leaves')} className="card p-4 hover:bg-gray-100 cursor-pointer text-center">
          <p className="font-semibold">Leaves</p>
        </button>
        <button onClick={() => navigate('/attendance')} className="card p-4 hover:bg-gray-100 cursor-pointer text-center">
          <p className="font-semibold">Attendance</p>
        </button>
      </div>
    </div>
  );
};

export default Swaps;
