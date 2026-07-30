// src/components/Navbar.jsx
import { Menu, LogOut, UserCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

function getInitials(name = '') {
  return name
    .replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Prof\.)\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('')
}

export default function Navbar({ onMenuClick }) {
  const { t } = useTranslation()
  const { profile, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('good_morning')
    if (h < 17) return t('good_afternoon')
    return t('good_evening')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isAdmin   = profile?.role === 'admin'
  const isStudent = profile?.role === 'student'
  const showAvatar = !isAdmin  // teachers + students get avatar
  const onProfile  = location.pathname === '/profile'

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="navbar-greeting">
          <span className="greeting-text">{getGreeting()},</span>
          <span className="greeting-name">
            {isAdmin ? 'Admin' : profile?.name || 'Welcome'}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <LanguageSwitcher />
        <ThemeToggle />

        {/* Logout for admin */}
        {isAdmin && (
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.85rem', borderRadius: 0,
              border: '1px solid var(--border)', background: 'var(--bg-input)',
              color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2'
              e.currentTarget.style.color = '#ef4444'
              e.currentTarget.style.borderColor = '#ef444444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-input)'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        )}

        {/* Avatar / profile button for teachers & students */}
        {showAvatar && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/profile')}
              title="My Profile"
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: onProfile
                  ? 'linear-gradient(135deg, var(--primary-hover), var(--primary))'
                  : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: '#fff',
                fontWeight: 700, fontSize: '0.78rem', letterSpacing: '-0.5px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: onProfile ? '0 0 0 3px rgba(247,127,50,0.3)' : 'none',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(247,127,50,0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = onProfile ? '0 0 0 3px rgba(247,127,50,0.3)' : 'none'
                e.currentTarget.style.background = onProfile
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                  : 'linear-gradient(135deg, var(--primary)55, var(--primary-hover)55)'
              }}
            >
              {getInitials(profile?.name) || <UserCircle size={18} />}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
