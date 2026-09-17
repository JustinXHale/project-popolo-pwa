import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import type { UserRole } from '../../types/models'

export function isLocalFormPreview(search: string) {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(search).get('preview') === '1'
  )
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const localPreview = isLocalFormPreview(location.search)

  if (loading && !localPreview) {
    return (
      <div className="container section">
        <p>Checking sign-in…</p>
      </div>
    )
  }

  const next = `${location.pathname}${location.search}`

  if (!user && !localPreview) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(next)}`}
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[]
  children: React.ReactNode
}) {
  const { role, loading, isDemoAuth } = useAuth()
  if (loading) {
    return (
      <div className="container section">
        <p>Loading…</p>
      </div>
    )
  }
  if (isDemoAuth && !roles.includes(role) && role !== 'admin') {
    return <Navigate to="/" replace />
  }
  if (!roles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}
