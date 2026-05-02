import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  total_hours: number;
  status: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      try {
        const res = await api.getWeekAttendance();
        setRecords(res.records);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = res.records.find(r => r.date === todayStr);
        setToday(todayRecord || null);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const presentDays = records.filter(r => r.status === 'present').length;
  const incompleteDays = records.filter(r => r.status === 'incomplete').length;
  const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);

  const stats = [
    { label: 'Days Present', value: presentDays, icon: CheckCircle, color: 'emerald' },
    { label: 'Incomplete Days', value: incompleteDays, icon: AlertCircle, color: 'amber' },
    { label: 'Total Hours', value: totalHours.toFixed(1), icon: Clock, color: 'blue' },
    { label: 'Avg Hours/Day', value: records.length ? (totalHours / records.length).toFixed(1) : '0', icon: TrendingUp, color: 'teal' },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-500' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name}
        </h1>
        <p className="text-gray-500 mt-1">Here's your attendance overview</p>
      </div>

      {/* Today's status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Today's Status</h2>
        {today ? (
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              today.status === 'present' ? 'bg-emerald-100' : today.status === 'incomplete' ? 'bg-amber-100' : 'bg-gray-100'
            }`}>
              {today.status === 'present' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : today.status === 'incomplete' ? (
                <AlertCircle className="w-6 h-6 text-amber-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 capitalize">
                {today.status === 'present' ? 'Present' : today.status === 'incomplete' ? 'Incomplete' : 'Not Punched In'}
              </p>
              <p className="text-sm text-gray-500">
                {today.punch_in
                  ? `In: ${new Date(today.punch_in).toLocaleTimeString()} ${today.punch_out ? `| Out: ${new Date(today.punch_out).toLocaleTimeString()} | ${today.total_hours.toFixed(1)}h` : ''}`
                  : 'No punch-in recorded yet'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No attendance record for today. Head to Attendance to punch in.</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`${c.bg} rounded-2xl p-5`}>
              <Icon className={`w-5 h-5 ${c.icon} mb-2`} />
              <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
              <p className="text-sm text-gray-600 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent records */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">This Week's Records</h2>
        </div>
        {records.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">No records this week</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.map((r) => (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.punch_in ? new Date(r.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    {' -> '}
                    {r.punch_out ? new Date(r.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{r.total_hours.toFixed(1)}h</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    r.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'incomplete' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
