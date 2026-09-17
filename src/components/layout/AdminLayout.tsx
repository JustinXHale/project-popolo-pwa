import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { isAdmin as roleIsAdmin } from '../../types/models'
import { Button } from '../ui/Button'
import './AdminLayout.css'

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pages', label: 'Site pages' },
  { to: '/admin/event-applications', label: 'Event apps' },
  { to: '/admin/referees', label: 'Referees' },
  { to: '/admin/games', label: 'Match log' },
  { to: '/admin/evaluations', label: 'Evaluations' },
  { to: '/admin/photos', label: 'IG photos' },
  { to: '/admin/requests', label: 'Requests' },
  { to: '/admin/messages', label: 'Inbox' },
  { to: '/admin/users', label: 'Users' },
]

export function AdminLayout() {
  const { user, role, loading, signOut, isDemoAuth } =
    useAuth()

  if (loading) {
    return <div className="admin-shell container section">Loading…</div>
  }

  const demoBypass = isDemoAuth

  if (!demoBypass && user && !roleIsAdmin(role)) {
    return <Navigate to="/" replace />
  }

  if (!demoBypass && !user) {
    return <Navigate to="/login?next=/admin" replace />
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <p className="admin-nav__brand">Pōpolo Admin</p>
        <nav>
          <ul>
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-nav__foot">
          <NavLink to="/">View site</NavLink>
          {user ? (
            <Button size="sm" variant="secondary" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <span className="admin-nav__demo">Demo admin</span>
          )}
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
