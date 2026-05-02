import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import WebcamCapture from '../components/WebcamCapture';
import { Clock, Mail, Lock, User, ArrowRight, Camera, CheckCircle } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceEncoding, setFaceEncoding] = useState<Float32Array | null>(null);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleFaceCapture = (descriptor: Float32Array) => {
    setFaceEncoding(descriptor);
    setFaceCaptured(true);
    setShowCamera(false);
  };

  const handleFaceError = (msg: string) => {
    setError(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!faceEncoding) {
      setError('Please capture your face for registration');
      return;
    }

    setLoading(true);
    const encodingBase64 = btoa(String.fromCharCode(...new Uint8Array(faceEncoding.buffer)));
    const { error } = await signUp(email, password, fullName, encodingBase64, role);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4">
            <Clock className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-1">Register for AttendAI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'employee', label: 'Employee', color: 'gray' },
                { value: 'hr', label: 'HR', color: 'teal' },
                { value: 'admin', label: 'Admin', color: 'blue' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                    role === value
                      ? color === 'teal'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : color === 'blue'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Face Registration</label>
            {faceCaptured ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700">Face captured successfully</span>
                <button
                  type="button"
                  onClick={() => { setFaceCaptured(false); setFaceEncoding(null); setShowCamera(true); }}
                  className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Retake
                </button>
              </div>
            ) : !showCamera ? (
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Capture Face
              </button>
            ) : (
              <WebcamCapture
                mode="register"
                onCapture={handleFaceCapture}
                onError={handleFaceError}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !faceCaptured}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
