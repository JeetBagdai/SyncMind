// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // If there's an explicit theme saved, use it. Otherwise, default to 'light'
    const saved = localStorage.getItem('gs-theme');
    return saved ? saved : 'light';
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gs-theme', theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
