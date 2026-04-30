import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Employee, Shift } from '../types';

interface ReassignShiftModalProps {
  isOpen: boolean;
  shift: Shift | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReassignShiftModal = ({ isOpen, shift, onClose, onSuccess }: ReassignShiftModalProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && shift) {
      // Fetch all employees
      fetchEmployees();
      // Set initial values from selected shift
      setSelectedEmployee(shift.employee?.id || '');
      if (shift.startTime) {
        setStartTime(new Date(shift.startTime).toISOString().slice(0, 16));
      }
      if (shift.endTime) {
        setEndTime(new Date(shift.endTime).toISOString().slice(0, 16));
      }
    }
  }, [isOpen, shift]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      const payload = res.data.data || res.data;
      const empList = payload.employees || payload.data || [];
      setEmployees(Array.isArray(empList) ? empList : []);
    } catch (err: any) {
      setError('Failed to load employees');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!startTime || !endTime) {
      setError('Start and end times are required');
      setLoading(false);
      return;
    }

    if (!selectedEmployee) {
      setError('Please select an employee');
      setLoading(false);
      return;
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }

    try {
      await api.put(`/shifts/${shift?.id}`, {
        employee: selectedEmployee,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reassign shift');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reassign Shift</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Shift Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Current: <span className="font-semibold">{shift.title}</span>
            </p>
          </div>

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign to Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.firstName} {emp.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          {/* Duration Info */}
          {startTime && endTime && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Duration:{' '}
                <span className="font-semibold">
                  {((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60)).toFixed(2)} hours
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn flex-1"
              disabled={loading}
            >
              {loading ? 'Reassigning...' : 'Reassign Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignShiftModal;
