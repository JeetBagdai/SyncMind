// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mail, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ThemeToggle from '../components/ThemeToggle'
import './Login.css'

export default function Login() {
  const { t } = useTranslation()
  const { login, loginWithGoogle, profile } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let userRole = profile?.role
      const res = await login(email, password)
      if (res?.profileData?.role) userRole = res.profileData.role
      navigate(userRole === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await loginWithGoogle()
      const userRole = res?.profileData?.role || profile?.role
      navigate(userRole === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Dynamic Background */}
      <div className="premium-bg">
        <div 
          className="bg-glow" 
          style={{ 
            left: `${mousePosition.x}px`, 
            top: `${mousePosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }} 
        />
        <div className="bg-shape shape-1" />
        <div className="bg-shape shape-2" />
        <div className="bg-shape shape-3" />
        <div className="bg-grid-overlay" />
      </div>

      {/* Top Bar */}
      <motion.div 
        className="premium-topbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="premium-logo">
          <img src="/logo.png" alt="GyaanaSetu Logo" style={{ width: 36, height: 36, borderRadius: 0}} />
          <span>GyaanaSetu - BNMIT</span>
        </div>
        <div className="topbar-actions">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </motion.div>

      <div className="premium-container">
        {/* Left Side: Brand Story */}
        <motion.div 
          className="premium-hero"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-content">
            <motion.div 
              className="badge-pill"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles size={14} className="sparkle-icon" />
              <span>{t('next_gen_education', 'Next-Gen Education')}</span>
            </motion.div>
            
            <h1 className="hero-title">
              {t('empower_your', 'Empower Your ')} <br/>
              <span className="text-gradient">{t('learning_journey', 'Learning Journey')}</span>
            </h1>
            
            <p className="hero-subtitle">
              {t('hero_subtitle', 'Experience the future of higher education with AI-driven insights, interactive course libraries, and smart learning tools.')}
            </p>
          </div>
        </motion.div>

        {/* Right Side: Auth Card */}
        <motion.div 
          className="premium-auth-wrapper"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <div className="premium-card">
            <AnimatePresence mode="wait">
              <form onSubmit={handleSubmit} className="premium-form">
                <div className="form-header">
                  <h2>{t('welcome_back', 'Welcome Back')}</h2>
                  <p>{t('sign_in', 'Enter your credentials to access your account')}</p>
                </div>

                {/* Common Fields */}
                <div className="premium-input-group">
                  <label>{t('email', 'Email Address')}</label>
                  <div className="input-container">
                    <Mail size={18} className="icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="premium-input-group">
                  <label>{t('password', 'Password')}</label>
                  <div className="input-container">
                    <Lock size={18} className="icon" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="forgot-password">
                    <a href="#">Forgot password?</a>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    className="premium-error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span>⚠️</span> {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="premium-submit-btn"
                  disabled={loading}
                >
                  <div className="btn-bg"></div>
                  <span className="btn-text">
                    {loading ? (
                      <span className="loading-spinner" />
                    ) : (
                      t('login', 'Sign In')
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>or continue with</span>
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  className="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
