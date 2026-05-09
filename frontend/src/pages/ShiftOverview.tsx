import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shift, Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import RoleGate from '../components/RoleGate';
import toast from 'react-hot-toast';
import LoadingButton from '../components/LoadingButton';

const formatDate = (iso?: string | Date) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const ShiftOverview = () => {
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all shifts
      const shiftsRes = await api.get('/shifts?limit=500');
      const shiftsPayload = shiftsRes.data.data || shiftsRes.data;
      const shiftsList = shiftsPayload.shifts || shiftsPayload.data || [];
      setShifts(Array.isArray(shiftsList) ? shiftsList : []);

      // Fetch all employees
      const empRes = await api.get('/employees?limit=500');
      const empPayload = empRes.data.data || empRes.data;
      const empList = empPayload.employees || empPayload.data || [];
      setEmployees(Array.isArray(empList) ? empList : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      toast.error('Failed to load shifts and employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter((shift) => {
    // Filter by employee
    if (selectedEmployee && shift.employee?.id !== selectedEmployee) {
      return false;
    }

    // Filter by status
    if (statusFilter && shift.status !== statusFilter) {
      return false;
    }

    // Filter by date range
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      const shiftStart = new Date(shift.startTime as any);
      if (shiftStart < start) return false;
    }

    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      const shiftEnd = new Date(shift.endTime as any);
      if (shiftEnd > end) return false;
    }

    return true;
  });

  const handleExport = () => {
    setExporting(true);
    try {
      const data = filteredShifts.map((shift) => ({
      Employee: `${shift.employee?.user?.firstName} ${shift.employee?.user?.lastName}`,
      Title: shift.title,
      Start: formatDate(shift.startTime),
      End: formatDate(shift.endTime),
      Status: shift.status,
      Type: shift.type,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-overview-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Shifts exported successfully');
  } finally {
    setExporting(false);
  }
  };

  return (
    <RoleGate allowedRoles={['admin', 'manager']}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">All Employees Shifts</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button onClick={() => navigate('/schedule')} className="btn">← Back to Schedule</button>
          <LoadingButton onClick={handleExport} className="btn btn-secondary" loading={exporting}>
            📥 Export as CSV
          </LoadingButton>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input w-full"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.firstName} {emp.user?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input w-full"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing <span className="font-semibold">{filteredShifts.length}</span> shift(s) out of{' '}
              <span className="font-semibold">{shifts.length}</span> total
            </p>
          </div>
        </div>

        {/* Shifts Table */}
        <div className="card p-6">
          {loading && <p>Loading shifts...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              {filteredShifts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No shifts found matching your filters</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">Shift Title</th>
                      <th className="px-4 py-3 font-semibold">Start Time</th>
                      <th className="px-4 py-3 font-semibold">End Time</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredShifts.map((shift) => {
                      const duration =
                        shift.endTime && shift.startTime
                          ? ((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) /
                              (1000 * 60 * 60)).toFixed(2)
                          : '—';

                      return (
                        <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 font-medium">
                            {shift.employee?.user?.firstName} {shift.employee?.user?.lastName}
                          </td>
                          <td className="px-4 py-3">{shift.title || 'Shift'}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(shift.startTime as any)}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(shift.endTime as any)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-medium">
                              {shift.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(shift.status)}`}>
                              {shift.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{duration}h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
};

export default ShiftOverview;
