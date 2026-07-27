// src/components/ThemeToggle.jsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className={`theme-toggle-icon ${theme === 'dark' ? 'active' : ''}`}>
        <Moon size={16} />
      </span>
      <span className={`theme-toggle-icon ${theme === 'light' ? 'active' : ''}`}>
        <Sun size={16} />
      </span>
    </button>
  )
}
