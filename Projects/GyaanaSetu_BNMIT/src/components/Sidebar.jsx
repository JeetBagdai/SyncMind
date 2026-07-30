// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  Calendar, MessageCircle, ShieldCheck,
  LogOut, GraduationCap, LayoutGrid, BarChart3, Code2
} from 'lucide-react'
import './Sidebar.css'

const STUDENT_NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, color: '#ea580c' },
  { to: '/learning',   label: 'Learning',   icon: BookOpen,         color: '#ea580c' },
  { to: '/codeit',     label: 'CodeIT',     icon: Code2,            color: '#ea580c' },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck,   color: '#e85d04' },
  { to: '/timetable',  label: 'Timetable',  icon: Calendar,         color: '#f59e0b' },
  { to: '/chatbot',    label: 'AI Tutor',   icon: MessageCircle,    color: '#e65c00' },
]

const TEACHER_NAV_BASE = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, color: '#ea580c' },
  { to: '/attendance', label: 'Attendance',  icon: ClipboardCheck,  color: '#e85d04' },
  { to: '/performance', label: 'Performance', icon: BarChart3,       color: '#e65c00' },
  { to: '/timetable',  label: 'My Schedule', icon: Calendar,        color: '#f59e0b' },
]

// Injected only when profile.timetableManager === true
const TIMETABLE_MANAGER_ITEM = {
  to: '/timetable-manage', label: 'Manage Timetable', icon: LayoutGrid, color: '#ea580c',
}

const ADMIN_NAV = [
  { to: '/admin',     label: 'Admin Panel', icon: ShieldCheck, color: '#ef4444' },
  { to: '/timetable', label: 'Timetable',   icon: Calendar,    color: '#f59e0b' },
]

function getNav(profile) {
  if (profile?.role === 'admin')   return ADMIN_NAV
  if (profile?.role === 'teacher') {
    if (profile?.timetableManager === true) {
      // Insert Manage Timetable after My Schedule
      const nav = [...TEACHER_NAV_BASE]
      nav.splice(3, 0, TIMETABLE_MANAGER_ITEM)
      return nav
    }
    return TEACHER_NAV_BASE
  }
  return STUDENT_NAV
}

export default function Sidebar({ className }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = getNav(profile)

  const roleLabel = profile?.role === 'admin'
    ? 'Administrator'
    : profile?.role === 'teacher' ? 'Faculty' : 'Student'

  const roleBadgeStyle = profile?.role === 'admin'
    ? { background: '#fee2e2', color: '#ef4444' }
    : profile?.role === 'teacher'
      ? { background: '#ffedd5', color: '#e85d04' }
      : { background: '#fff2e8', color: '#ea580c' }

  return (
    <aside className={`sidebar ${className || ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/logo.png" alt="GyaanaSetu Logo" style={{ width: 40, height: 40, borderRadius: 0 }} />
        <div className="logo-text">
          <span className="logo-name">GyaanaSetu</span>
        </div>
      </div>

      {/* User chip */}
      {profile && (
        <div className="sidebar-user">
          <div className="user-avatar">{profile.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{profile.name}</span>
            <span className="user-role badge" style={roleBadgeStyle}>{roleLabel}</span>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon, color }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? { '--item-color': color } : {}}
          >
            <span className="sidebar-item-icon"><Icon size={18} /></span>
            <span className="sidebar-item-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
