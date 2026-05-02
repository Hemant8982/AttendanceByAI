import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogOut, Clock, LayoutDashboard, Shield, Bot, FileText, Menu, X, Users } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'employee', 'hr'] },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'employee', 'hr'] },
  { to: '/overtime', label: 'Overtime', icon: FileText, roles: ['admin', 'employee', 'hr'] },
  { to: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
  { to: '/hr', label: 'HR Panel', icon: Users, roles: ['hr'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot, roles: ['admin', 'employee', 'hr'] },
];

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = profile?.role || 'employee';

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-gray-600 hover:bg-gray-50'
    }`;

  const roleBadge: Record<string, { bg: string; text: string }> = {
    admin: { bg: 'bg-blue-100', text: 'text-blue-700' },
    hr: { bg: 'bg-teal-100', text: 'text-teal-700' },
    employee: { bg: 'bg-gray-100', text: 'text-gray-600' },
  };

  const badge = roleBadge[role] || roleBadge.employee;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-lg text-gray-900">AttendAI</span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {filteredItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side: user info + sign out + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badge.bg} ${badge.text}`}>
                {role}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {filteredItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={mobileLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
