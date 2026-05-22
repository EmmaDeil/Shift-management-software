import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shift } from '../types';
import { useAuth } from '../context/AuthContext';
import ReassignShiftModal from '../components/ReassignShiftModal';
import toast from 'react-hot-toast';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

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

const DnDCalendar = withDragAndDrop(Calendar as any);

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
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isShiftDetailsOpen, setIsShiftDetailsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingShift, setCreatingShift] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    employee: '',
    startTime: '',
    endTime: '',
    type: 'regular',
    location: '',
    notes: '',
  });
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchShifts();
    if (isManagerOrAdmin) {
      fetchEmployees();
    }
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

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { limit: 500 } });
      const payload = res.data.data || res.data;
      const employeeList = payload.employees || payload.data || payload;
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load employees for scheduling');
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

  const openCreateModal = (start?: Date, end?: Date) => {
    if (!isManagerOrAdmin) return;

    const fallbackStart = start || new Date();
    const fallbackEnd = end || new Date(fallbackStart.getTime() + 8 * 60 * 60 * 1000);

    setCreateError(null);
    setCreateForm({
      title: '',
      employee: '',
      startTime: fallbackStart.toISOString().slice(0, 16),
      endTime: fallbackEnd.toISOString().slice(0, 16),
      type: 'regular',
      location: '',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.title || !createForm.employee || !createForm.startTime || !createForm.endTime) {
      setCreateError('Title, employee, start time, and end time are required');
      return;
    }

    const start = new Date(createForm.startTime);
    const end = new Date(createForm.endTime);

    if (end <= start) {
      setCreateError('End time must be after start time');
      return;
    }

    setCreatingShift(true);
    try {
      await api.post('/shifts', {
        title: createForm.title,
        employee: createForm.employee,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: createForm.type,
        location: createForm.location,
        notes: createForm.notes,
      });

      toast.success('Shift created successfully');
      closeCreateModal();
      fetchShifts();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create shift');
    } finally {
      setCreatingShift(false);
    }
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

    toast.success('Shift details opened');
    setSelectedShift(event.resource);
    setIsShiftDetailsOpen(true);
  };

  const closeShiftDetailsModal = () => {
    setIsShiftDetailsOpen(false);
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (!isManagerOrAdmin) return;
    openCreateModal(slotInfo.start, slotInfo.end);
  };

  const handleEventTimeChange = async ({ event, start, end }: any) => {
    if (!isManagerOrAdmin) return;

    const shift = event?.resource;
    const shiftId = shift?.id || shift?._id;
    if (!shiftId) {
      toast.error('Unable to update shift time');
      return;
    }

    try {
      await api.put(`/shifts/${shiftId}`, {
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });

      toast.success('Shift schedule updated');
      fetchShifts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update shift time');
      fetchShifts();
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Schedule</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {isManagerOrAdmin
          ? 'Calendar view for all employees. Click a shift to reassign or click an empty slot to create a new shift.'
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
        {isManagerOrAdmin && (
          <button onClick={() => openCreateModal()} className="btn btn-primary">Create Shift</button>
        )}
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
              <DnDCalendar
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
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventStyleGetter}
                draggableAccessor={() => isManagerOrAdmin}
                resizable={isManagerOrAdmin}
                onEventDrop={handleEventTimeChange}
                onEventResize={handleEventTimeChange}
              />
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Shift</h2>

            {createError && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    value={createForm.title}
                    onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                    className="input w-full"
                    placeholder="Morning Shift"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                  <select
                    value={createForm.employee}
                    onChange={(e) => setCreateForm((f) => ({ ...f, employee: e.target.value }))}
                    className="input w-full"
                    required
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp: any, index) => {
                      const empId = emp.id || emp._id || `emp-${index}`;
                      return (
                        <option key={`${empId}-${index}`} value={empId}>
                          {emp.user?.firstName} {emp.user?.lastName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={createForm.startTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={createForm.endTime}
                    onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="regular">Regular</option>
                    <option value="overtime">Overtime</option>
                    <option value="on-call">On-call</option>
                    <option value="training">Training</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    value={createForm.location}
                    onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
                    className="input w-full"
                    placeholder="Main Branch"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input w-full min-h-[90px]"
                  placeholder="Optional scheduling notes"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeCreateModal} className="btn" disabled={creatingShift}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingShift}>
                  {creatingShift ? 'Creating...' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isShiftDetailsOpen && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Shift</h2>
              <button onClick={closeShiftDetailsModal} className="btn">Close</button>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Title:</span> {selectedShift.title || 'Shift'}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Employee:</span> {selectedShift.employee?.user?.firstName} {selectedShift.employee?.user?.lastName}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Start:</span> {formatDate(selectedShift.startTime as any)}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">End:</span> {formatDate(selectedShift.endTime as any)}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Status:</span> {selectedShift.status}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Location:</span> {selectedShift.location || '—'}</p>
              <p className="text-gray-700 dark:text-gray-200"><span className="font-medium">Notes:</span> {selectedShift.notes || '—'}</p>
            </div>
          </div>
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
