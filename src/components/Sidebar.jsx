import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  BarChart3,
  LogOut,
  ClipboardList,
  Users,
  School,
  UserCircle,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Avatar } from './UI';
import ThemeToggle from './ThemeToggle';

const studentNav = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/labs', label: 'My Labs', icon: BookOpen },
  { to: '/student/profile', label: 'Profile', icon: UserCircle },
];

const facultyNav = [
  { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/faculty/labs', label: 'Labs', icon: FlaskConical },
  {
    to: '/faculty/student-progress',
    label: 'Student Progress',
    icon: BarChart3,
  },
  {
    to: '/faculty/reviews',
    label: 'Reviews',
    icon: ClipboardList,
  },
  {
    to: '/faculty/profile',
    label: 'Profile',
    icon: UserCircle,
  },
];

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/admin/faculty',
    label: 'Manage Faculty',
    icon: ClipboardList,
  },
  {
    to: '/admin/students',
    label: 'Manage Students',
    icon: Users,
  },
  {
    to: '/admin/classes',
    label: 'Manage Classes',
    icon: School,
  },
];

const navByRole = {
  student: studentNav,
  faculty: facultyNav,
  admin: adminNav,
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const nav = navByRole[user.role] || [];

  return (
    <aside className="sidebar">

      {/* ================= BRAND ================= */}
      <div className="sidebar-brand">
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 5px 12px',
            boxSizing: 'border-box',
          }}
        >

          {/* Logo */}
          <img
            src="/logo.png"
            alt="Vertex Lab"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          {/* Brand */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '5px',
              width: '100%',
              lineHeight: 1,
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                lineHeight: '18px',
                whiteSpace: 'nowrap',
                color: '#111827',
              }}
            >
              VERTEX LAB
            </div>

            <div
              style={{
                fontSize: '9px',
                fontWeight: '500',
                letterSpacing: '0.4px',
                lineHeight: '12px',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                color: '#64748b',
              }}
            >
              EVALUATION PLATFORM
            </div>
          </div>

        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="sidebar-nav">

        <div className="sidebar-section-label">
          Navigation
        </div>

        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon
              className="icon"
              size={16}
            />

            {label}
          </NavLink>
        ))}

      </nav>

      {/* ================= FOOTER ================= */}
      <div className="sidebar-footer">

        <div className="sidebar-user">

          <Avatar
            user={user}
            size={36}
          />

          <div
            className="sidebar-user-info"
            style={{
              marginLeft: 8,
            }}
          >
            <div className="sidebar-user-name truncate">
              {user.name || user.email}
            </div>

            <div className="sidebar-user-role">
              {user.role}
            </div>
          </div>

        </div>

        {/* Logout + Theme */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-2)',
          }}
        >

          <button
            className="btn btn-ghost flex-1"
            style={{
              justifyContent: 'flex-start',
            }}
            onClick={logout}
          >
            <LogOut size={14} />
            Logout
          </button>

          <ThemeToggle />

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;