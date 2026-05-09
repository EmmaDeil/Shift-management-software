import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shift } from '../types';
import { useAuth } from '../context/AuthContext';
import ReassignShiftModal from '../components/ReassignShiftModal';
import toast from 'react-hot-toast';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const formatDate = (iso?: string | Date) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
};

const statusLegend = [
  { key: 'scheduled', label: 'Scheduled', color: '#7c3aed' },
  { key: 'in-progress', label: 'In Progress', color: '#2563eb' },
  { key: 'completed', label: 'Completed', color: '#16a34a' },
  { key: 'cancelled', label: 'Cancelled', color: '#dc2626' },
  { key: 'no-show', label: 'No Show', color: '#3b82f6' },
];

const Schedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shifts', { params: { limit: 500 } });
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

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();

    shifts.forEach((s: any) => {
      const employeeId = s.employee?.id || s.employee?._id;
      const fullName = `${s.employee?.user?.firstName || ''} ${s.employee?.user?.lastName || ''}`.trim();

      if (employeeId && fullName && !map.has(employeeId)) {
        map.set(employeeId, fullName);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((s: any) => {
      const shiftEmployeeId = s.employee?.id || s.employee?._id;

      if (isManagerOrAdmin && employeeFilter && shiftEmployeeId !== employeeFilter) {
        return false;
      }

      if (statusFilter && s.status !== statusFilter) {
        return false;
      }

      if (startDateFilter) {
        const start = new Date(startDateFilter);
        const shiftStart = new Date(s.startTime);
        if (shiftStart < start) return false;
      }

      if (endDateFilter) {
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999);
        const shiftEnd = new Date(s.endTime);
        if (shiftEnd > end) return false;
      }

      return true;
    });
  }, [shifts, isManagerOrAdmin, employeeFilter, statusFilter, startDateFilter, endDateFilter]);

  const clearFilters = () => {
    setEmployeeFilter('');
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const calendarEvents = useMemo(() => {
    return filteredShifts
      .filter((s: any) => s?.startTime && s?.endTime)
      .map((s: any) => {
        const employeeName = `${s.employee?.user?.firstName || ''} ${s.employee?.user?.lastName || ''}`.trim();
        const baseTitle = s.title || s.position || 'Shift';

        return {
          id: s.id || s._id,
          title: isManagerOrAdmin && employeeName ? `${employeeName} - ${baseTitle}` : baseTitle,
          start: new Date(s.startTime),
          end: new Date(s.endTime),
          resource: s,
        };
      });
  }, [filteredShifts, isManagerOrAdmin]);

  const eventStyleGetter = (event: Event & { resource?: any }) => {
    const status = event.resource?.status;
    let backgroundColor = '#3b82f6';

    if (status === 'completed') backgroundColor = '#16a34a';
    if (status === 'cancelled') backgroundColor = '#dc2626';
    if (status === 'in-progress') backgroundColor = '#2563eb';
    if (status === 'scheduled') backgroundColor = '#7c3aed';

    return {
      style: {
        backgroundColor,
        border: 'none',
        color: '#ffffff',
        borderRadius: '8px',
        padding: '2px 6px',
      },
    };
  };

  const handleSelectEvent = (event: Event & { resource?: Shift }) => {
    if (!event.resource) return;
    if (isManagerOrAdmin) {
      handleReassignClick(event.resource);
      return;
    }

    toast.success('Shift details loaded below');
    setSelectedShift(event.resource);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Schedule</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {isManagerOrAdmin
          ? 'Calendar view for all employees. Click any shift to reassign.'
          : 'Your assigned shifts in calendar view.'}
      </p>

      <div className="mb-4 flex gap-2 flex-wrap">
        <button onClick={() => navigate('/dashboard')} className="btn">← Back to Dashboard</button>
        {isManagerOrAdmin && (
          <button onClick={() => navigate('/shift-overview')} className="btn btn-secondary">
            View All Shifts
          </button>
        )}
        <button onClick={() => navigate('/swaps')} className="btn">Request Swap</button>
        <button onClick={() => navigate('/attendance')} className="btn">Clock In/Out</button>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {isManagerOrAdmin && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="input w-full"
            >
              <option value="">All Employees</option>
              {employeeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          )}

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

          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="input w-full"
          />

          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="input w-full"
          />

          <button onClick={clearFilters} className="btn">Clear Filters</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {statusLegend.map((item) => (
            <div key={item.key} className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        {loading && <p>Loading schedule...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && calendarEvents.length === 0 && (
          <p className="text-gray-600">No shifts found for the selected period.</p>
        )}

        {!loading && !error && calendarEvents.length > 0 && (
          <div className="overflow-x-auto">
            <div className="min-w-[760px] md:min-w-0">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: 700 }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="week"
                popup
                selectable
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
              />
            </div>
          </div>
        )}
      </div>

      {selectedShift && (
        <div className="card p-6 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Selected Shift</h2>
          <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Title:</span> {selectedShift.title || 'Shift'}</p>
          <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Employee:</span> {selectedShift.employee?.user?.firstName} {selectedShift.employee?.user?.lastName}</p>
          <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Start:</span> {formatDate(selectedShift.startTime as any)}</p>
          <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">End:</span> {formatDate(selectedShift.endTime as any)}</p>
          <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Status:</span> {selectedShift.status}</p>
        </div>
      )}

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
