import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '../components/LoadingButton';

interface SwapRequest {
  id: string;
  requester: { _id: string; user: { firstName: string; lastName: string; email: string } };
  requestedWith: { _id: string; user: { firstName: string; lastName: string; email: string } };
  requesterShift: { _id: string; startTime: Date; endTime: Date; title: string };
  requestedShift?: { _id: string; startTime: Date; endTime: Date; title: string };
  status: 'pending' | 'peer-accepted' | 'peer-rejected' | 'manager-approved' | 'manager-rejected' | 'completed' | 'cancelled';
  peerResponse?: { status?: string };
  managerReview?: { status?: string };
  reason?: string;
  createdAt: Date;
}

const getEntityId = (item: any, fallback: string) => item?._id || item?.id || fallback;

const getStageState = (swapStatus: string, stage: 'requested' | 'peer' | 'manager') => {
  if (stage === 'requested') {
    return 'done';
  }

  if (stage === 'peer') {
    if (swapStatus === 'peer-rejected' || swapStatus === 'cancelled') return 'rejected';
    if (['peer-accepted', 'manager-approved', 'manager-rejected', 'completed'].includes(swapStatus)) return 'done';
    return 'current';
  }

  if (swapStatus === 'manager-rejected') return 'rejected';
  if (['manager-approved', 'completed'].includes(swapStatus)) return 'done';
  if (swapStatus === 'peer-accepted') return 'current';
  return 'pending';
};

const getStageClass = (state: string) => {
  if (state === 'done') return 'bg-green-100 text-green-800 border-green-200';
  if (state === 'current') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (state === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const Swaps = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});
  const [showForm, setShowForm] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ shiftId: '', requestedToId: '', offeredShiftId: '', reason: '' });

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/swaps');
      const payload = res.data.data || res.data;
      const swapsList = payload.swaps || payload.data || payload;
      const normalized = (Array.isArray(swapsList) ? swapsList : []).map((s: any) => ({
        ...s,
        id: s.id || s._id,
      }));
      setSwaps(normalized);
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
      const employeesList = payload.employees || payload.users || payload.data || payload;
      setEmployees(Array.isArray(employeesList) ? employeesList : []);
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
      setActionLoading((s) => ({ ...s, [id]: accept ? 'respond-accept' : 'respond-reject' }));
      await api.put(`/swaps/${id}/peer-response`, { accept });
      toast.success(accept ? 'Swap accepted' : 'Swap rejected');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      setActionLoading((s) => ({ ...s, [id]: approve ? 'approve' : 'reject' }));
      await api.put(`/swaps/${id}/manager-review`, { approve });
      toast.success(approve ? 'Swap approved' : 'Swap rejected');
      fetchSwaps();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to review');
    } finally {
      setActionLoading((s) => ({ ...s, [id]: null }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'peer-accepted':
        return 'bg-blue-100 text-blue-800';
      case 'manager-approved':
        return 'bg-green-100 text-green-800';
      case 'peer-rejected':
      case 'manager-rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shift Swaps</h1>
        <LoadingButton onClick={() => setShowForm(!showForm)} className="btn btn-primary" loading={creating && showForm}>
          {showForm ? 'Cancel' : 'Request Swap'}
        </LoadingButton>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 max-w-2xl">
          <select name="shiftId" value={form.shiftId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select your shift</option>
            {shifts.map((s, index) => {
              const shiftId = getEntityId(s, `shift-${index}`);
              return (
              <option key={`request-shift-${shiftId}-${index}`} value={shiftId}>
                {s.title || 'Shift'} - {new Date(s.startTime).toLocaleString()}
              </option>
              );
            })}
          </select>

          <select name="requestedToId" value={form.requestedToId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select employee to swap with</option>
            {employees.map((e, index) => {
              const employeeId = getEntityId(e, `employee-${index}`);
              return (
              <option key={`employee-${employeeId}-${index}`} value={employeeId}>
                {e.user?.firstName} {e.user?.lastName}
              </option>
              );
            })}
          </select>

          <select name="offeredShiftId" value={form.offeredShiftId} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded">
            <option value="">Select offered shift (optional)</option>
            {shifts.map((s, index) => {
              const shiftId = getEntityId(s, `offered-shift-${index}`);
              return (
              <option key={`offered-shift-${shiftId}-${index}`} value={shiftId}>
                {s.title || 'Shift'} - {new Date(s.startTime).toLocaleString()}
              </option>
              );
            })}
          </select>

          <textarea name="reason" placeholder="Reason for swap" value={form.reason} onChange={handleChange} className="mb-4 block w-full px-3 py-2 border rounded h-20"></textarea>

          <LoadingButton onClick={handleSubmit} className="btn btn-primary" loading={creating}>
            Submit Request
          </LoadingButton>
        </div>
      )}

      <div className="card p-6">
        {loading && <p>Loading swaps...</p>}

        {!loading && swaps.length === 0 && <p className="text-gray-600">No swap requests</p>}

        {!loading && swaps.length > 0 && (
          <div className="space-y-4">
            {swaps.map((swap, index) => {
              const swapId = getEntityId(swap, `swap-${index}`);

              return (
              <div key={`swap-card-${swapId}-${index}`} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {swap.requester.user.firstName} {swap.requester.user.lastName} → {swap.requestedWith.user.firstName} {swap.requestedWith.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{swap.reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(swap.status)}`}>
                    {swap.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStageClass(getStageState(swap.status, 'requested'))}`}>
                    Requested
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStageClass(getStageState(swap.status, 'peer'))}`}>
                    Peer Response
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStageClass(getStageState(swap.status, 'manager'))}`}>
                    Manager Review
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">From Shift</p>
                    <p className="text-gray-600">{new Date(swap.requesterShift.startTime).toLocaleString()}</p>
                  </div>
                  {swap.requestedShift && (
                    <div>
                      <p className="font-medium text-gray-700">To Shift</p>
                      <p className="text-gray-600">{new Date(swap.requestedShift.startTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Peer response (for requested employee) */}
                {swap.status === 'pending' && swap.requestedWith._id === (user?.id || (user as any)?._id) && (
                  <div className="flex gap-2">
                    <LoadingButton
                      onClick={() => handleRespond(swapId, true)}
                      className="btn btn-sm btn-primary"
                      loading={actionLoading[swapId] === 'respond-accept'}
                    >
                      Accept
                    </LoadingButton>

                    <LoadingButton
                      onClick={() => handleRespond(swapId, false)}
                      className="btn btn-sm"
                      loading={actionLoading[swapId] === 'respond-reject'}
                    >
                      Reject
                    </LoadingButton>
                  </div>
                )}

                {/* Manager review (for managers) */}
                {swap.status === 'peer-accepted' && user?.role !== 'employee' && (
                  <div className="flex gap-2">
                    <LoadingButton
                      onClick={() => handleApprove(swapId, true)}
                      className="btn btn-sm btn-primary"
                      loading={actionLoading[swapId] === 'approve'}
                    >
                      Approve
                    </LoadingButton>

                    <LoadingButton
                      onClick={() => handleApprove(swapId, false)}
                      className="btn btn-sm"
                      loading={actionLoading[swapId] === 'reject'}
                    >
                      Reject
                    </LoadingButton>
                  </div>
                )}

                {/* Status badges for responses */}
                {swap.peerResponse && (
                  <p className="text-sm mt-2 text-gray-600">
                    Peer response: <span className="font-medium">{swap.peerResponse.status || 'pending'}</span>
                  </p>
                )}
                {swap.managerReview && (
                  <p className="text-sm text-gray-600">
                    Manager decision: <span className="font-medium">{swap.managerReview.status || 'pending'}</span>
                  </p>
                )}
              </div>
              );
            })}
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
