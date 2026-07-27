// src/components/Navbar.jsx
import { Menu, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

export default function Navbar({ onMenuClick }) {
  const { t } = useTranslation()
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

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

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="navbar-greeting">
          <span className="greeting-text">{getGreeting()},</span>
          <span className="greeting-name">
            {profile?.role === 'admin'
              ? 'Admin'
              : profile?.name || 'Welcome'}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <LanguageSwitcher />
        {profile?.role === 'admin' && (
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
        <ThemeToggle />
      </div>
    </header>
  )
}
