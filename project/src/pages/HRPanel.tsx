import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Calendar, Download, Search, Users, FileText } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  total_hours: number;
  status: string;
  profiles: { full_name: string };
}

interface OvertimeRequest {
  id: string;
  user_id: string;
  date: string;
  reason: string;
  hours: number;
  status: string;
  created_at: string;
  profiles: { full_name: string };
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

type Tab = 'employees' | 'attendance' | 'overtime';

export default function HRPanel() {
  const [tab, setTab] = useState<Tab>('attendance');
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'employees') {
          const res = await api.getEmployees();
          setEmployees(res.employees as Profile[]);
        } else if (tab === 'attendance') {
          const res = await api.getAdminAttendance(dateFrom || undefined, dateTo || undefined);
          setAttendance(res.records as AttendanceRecord[]);
        } else {
          const res = await api.getAllOvertime();
          setOvertime(res.records as OvertimeRequest[]);
        }
      } catch (err) {
        console.error('Failed to fetch HR data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [tab, dateFrom, dateTo]);

  const exportCSV = async () => {
    try {
      const csvText = await api.getAttendanceCsv(dateFrom || undefined, dateTo || undefined);
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const filteredAttendance = searchName
    ? attendance.filter(r => r.profiles?.full_name?.toLowerCase().includes(searchName.toLowerCase()))
    : attendance;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'overtime', label: 'Overtime', icon: FileText },
    { key: 'employees', label: 'Employees', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Panel</h1>
          <p className="text-gray-500 mt-1">View attendance, overtime, and employee data</p>
        </div>
        {tab === 'attendance' && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Attendance Tab */}
          {tab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Employee</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">In</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Out</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Hours</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAttendance.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-medium text-gray-900">{r.profiles?.full_name || 'Unknown'}</td>
                          <td className="px-6 py-3 text-gray-600">{r.date}</td>
                          <td className="px-6 py-3 text-gray-600">
                            {r.punch_in ? new Date(r.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-6 py-3 text-gray-600">
                            {r.punch_out ? new Date(r.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{r.total_hours.toFixed(1)}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              r.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'incomplete' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAttendance.length === 0 && (
                  <p className="p-6 text-center text-gray-500 text-sm">No attendance records found</p>
                )}
              </div>
            </div>
          )}

          {/* Overtime Tab - Read only for HR */}
          {tab === 'overtime' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">{overtime.length} requests (read-only)</p>
              </div>
              <div className="divide-y divide-gray-50">
                {overtime.map(r => (
                  <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{r.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {r.date} | {r.hours}h overtime | {r.reason}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
              {overtime.length === 0 && (
                <p className="p-6 text-center text-gray-500 text-sm">No overtime requests</p>
              )}
            </div>
          )}

          {/* Employees Tab - Read only for HR */}
          {tab === 'employees' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm text-gray-500">{employees.length} employees</p>
              </div>
              <div className="divide-y divide-gray-50">
                {employees.map(emp => (
                  <div key={emp.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                        {emp.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.full_name}</p>
                        <p className="text-xs text-gray-500">Joined {new Date(emp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                      emp.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      emp.role === 'hr' ? 'bg-teal-100 text-teal-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
