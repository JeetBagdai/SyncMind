// src/components/LanguageSwitcher.jsx
import { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { changeLanguage, SUPPORTED_LANGUAGES } from '../services/i18n'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0]

  const handleSelect = (code) => {
    changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="lang-switcher" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <button className="lang-trigger" onClick={() => setOpen(o => !o)} aria-label="Change language">
        <Globe size={16} />
        <span>{current.nativeName}</span>
        <ChevronDown size={14} className={open ? 'rotated' : ''} />
      </button>
      {open && (
        <div className="lang-dropdown">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents focus change which triggers onBlur
                handleSelect(lang.code);
              }}
            >
              <span className="lang-native">{lang.nativeName}</span>
              <span className="lang-en">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
