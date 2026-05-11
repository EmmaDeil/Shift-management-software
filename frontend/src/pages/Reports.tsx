import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingButton from '../components/LoadingButton';

type ReportType = 'attendance' | 'schedule' | 'leaves' | 'payroll';

const Reports = () => {
  const { user } = useAuth();
  const canViewPayroll = user?.role === 'admin';
  const [type, setType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (!canViewPayroll && type === 'payroll') {
      setType('attendance');
    }
  }, [canViewPayroll, type]);

  const fetchReport = async () => {
    if (!startDate || !endDate) return toast.error('Select start and end dates');
    setLoading(true);
    try {
      const res = await api.get(`/reports/${type}`, { params: { startDate, endDate, format: 'json' } });
      const payload = res.data.data || res.data;
      // payload may contain attendance/shifts/leaves/payroll
      setData(payload[Object.keys(payload)[0]] || payload);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'excel' | 'pdf') => {
    if (!startDate || !endDate) return toast.error('Select start and end dates');
    setLoading(true);
    try {
      const res = await api.get(`/reports/${type}`, { params: { startDate, endDate, format }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!startDate || !endDate) return toast.error('Select start and end dates');
    setLoading(true);
    try {
      const res = await api.get(`/reports/${type}`, { params: { startDate, endDate, format: 'csv' }, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Reports & Analytics</h1>

      <div className="card p-6 w-full">
        <div className="grid grid-cols-1 gap-4 mb-4 xl:grid-cols-[minmax(0,18rem)_repeat(2,minmax(0,1fr))_auto]">
          <select value={type} onChange={(e) => setType(e.target.value as ReportType)} className="col-span-1">
            <option value="attendance">Attendance</option>
            <option value="schedule">Schedule</option>
            <option value="leaves">Leaves</option>
            {canViewPayroll && <option value="payroll">Payroll</option>}
          </select>

          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="col-span-1" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="col-span-1" />

          <div className="col-span-1 flex flex-wrap gap-2 xl:justify-end">
            <LoadingButton onClick={fetchReport} className="btn btn-primary" loading={loading}>
              Fetch
            </LoadingButton>
            <LoadingButton onClick={() => downloadReport('excel')} className="btn" loading={loading}>
              Export XLSX
            </LoadingButton>
            <LoadingButton onClick={() => downloadReport('pdf')} className="btn" loading={loading}>
              Export PDF
            </LoadingButton>
            <LoadingButton onClick={downloadCSV} className="btn" loading={loading}>
              Export CSV
            </LoadingButton>
          </div>
        </div>

        <div>
          {data.length === 0 && <p className="text-gray-600">No data. Fetch a report to view results.</p>}

          {data.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    {Object.keys(data[0]).slice(0, 8).map((k) => (
                      <th key={k} className="px-4 py-2 text-left">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(row).slice(0, 8).map((k) => (
                        <td key={k} className="px-4 py-2">{String(row[k])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
