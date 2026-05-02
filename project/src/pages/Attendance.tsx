import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import WebcamCapture from '../components/WebcamCapture';
import { LogIn, LogOut, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import * as faceapi from 'face-api.js';

interface AttendanceRecord {
  id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  punch_in_lat: number;
  punch_in_lng: number;
  punch_out_lat: number;
  punch_out_lng: number;
  total_hours: number;
  status: string;
}

export default function Attendance() {
  const { profile } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [punchType, setPunchType] = useState<'in' | 'out'>('in');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await api.getTodayAttendance();
      setTodayRecord(res.record);
    } catch (err) {
      console.error('Failed to fetch today record:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: 0, lng: 0 }),
        { timeout: 5000 }
      );
    });
  };

  const decodeFaceEncoding = (base64: string): Float32Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Float32Array(bytes.buffer);
  };

  const handlePunch = (type: 'in' | 'out') => {
    setPunchType(type);
    setShowCamera(true);
    setMessage(null);
  };

  const handleFaceCapture = async (descriptor: Float32Array) => {
    if (!profile) return;
    setProcessing(true);
    setShowCamera(false);

    if (profile.face_encoding) {
      const stored = decodeFaceEncoding(profile.face_encoding);
      const distance = faceapi.euclideanDistance(descriptor, stored);
      if (distance > 0.6) {
        setMessage({ type: 'error', text: 'Face not recognized. You are not authorized.' });
        setProcessing(false);
        return;
      }
    }

    const location = await getLocation();

    try {
      if (punchType === 'in') {
        const res = await api.punchIn(location.lat, location.lng);
        setMessage({ type: 'success', text: res.message });
        await fetchToday();
      } else {
        const res = await api.punchOut(location.lat, location.lng);
        setMessage({
          type: 'success',
          text: res.message,
        });
        await fetchToday();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Operation failed' });
    }
    setProcessing(false);
  };

  const handleFaceError = (msg: string) => {
    setMessage({ type: 'error', text: msg });
    setShowCamera(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasPunchedIn = !!todayRecord?.punch_in;
  const hasPunchedOut = !!todayRecord?.punch_out;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {processing && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-sm font-medium">Processing attendance...</p>
        </div>
      )}

      {/* Punch buttons */}
      {!showCamera && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handlePunch('in')}
            disabled={hasPunchedIn || processing}
            className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${hasPunchedIn ? 'bg-gray-100' : 'bg-emerald-100'}`}>
              <LogIn className={`w-7 h-7 ${hasPunchedIn ? 'text-gray-400' : 'text-emerald-600'}`} />
            </div>
            <span className={`font-semibold ${hasPunchedIn ? 'text-gray-400' : 'text-gray-900'}`}>Punch In</span>
            {hasPunchedIn && todayRecord.punch_in && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(todayRecord.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePunch('out')}
            disabled={!hasPunchedIn || hasPunchedOut || processing}
            className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${hasPunchedOut ? 'bg-gray-100' : !hasPunchedIn ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <LogOut className={`w-7 h-7 ${hasPunchedOut ? 'text-gray-400' : !hasPunchedIn ? 'text-gray-400' : 'text-blue-600'}`} />
            </div>
            <span className={`font-semibold ${hasPunchedOut || !hasPunchedIn ? 'text-gray-400' : 'text-gray-900'}`}>Punch Out</span>
            {hasPunchedOut && todayRecord.punch_out && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(todayRecord.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Camera */}
      {showCamera && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {punchType === 'in' ? 'Verify your face to punch in' : 'Verify your face to punch out'}
          </p>
          <WebcamCapture
            mode="verify"
            storedDescriptor={profile?.face_encoding ? decodeFaceEncoding(profile.face_encoding) : null}
            onCapture={handleFaceCapture}
            onError={handleFaceError}
          />
          <button
            onClick={() => setShowCamera(false)}
            className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Today's record details */}
      {todayRecord && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Today's Record</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Punch In</p>
              <p className="font-medium text-gray-900">
                {todayRecord.punch_in ? new Date(todayRecord.punch_in).toLocaleTimeString() : '--'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Punch Out</p>
              <p className="font-medium text-gray-900">
                {todayRecord.punch_out ? new Date(todayRecord.punch_out).toLocaleTimeString() : '--'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Hours</p>
              <p className="font-medium text-gray-900">{todayRecord.total_hours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                todayRecord.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {todayRecord.status}
              </span>
            </div>
          </div>
          {(todayRecord.punch_in_lat || todayRecord.punch_out_lat) && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location captured during punch in/out
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
