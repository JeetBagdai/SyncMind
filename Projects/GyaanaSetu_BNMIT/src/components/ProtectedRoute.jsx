// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-full">
        <div className="spinner" />
        <span>Loading GyaanaSetu...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
