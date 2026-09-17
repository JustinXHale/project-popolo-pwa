import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/auth-context'
import { RefereeOnboarding } from '../features/onboarding/RefereeOnboarding'
import { homePathForRole } from '../types/models'
import './AuthPages.css'
import '../features/onboarding/onboarding.css'

export function OnboardingPage() {
  const { user, profile, role, loading } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next')
  const loginTo = next
    ? `/login?next=${encodeURIComponent(next)}`
    : '/login?next=/onboarding'

  if (loading) {
    return (
      <div className="container section auth-page">
        <p>Checking sign-in…</p>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to={loginTo} replace />
  }

  if (role !== 'referee') {
    return (
      <div className="container section auth-page">
        <span className="eyebrow">Onboarding</span>
        <h1>Referee résumé</h1>
        <p>
          This guided flow is for match officials. Coaches and admins can go
          straight to the portal.
        </p>
        <ButtonLink to={homePathForRole(role)}>Continue</ButtonLink>
      </div>
    )
  }

  return (
    <div className="container section auth-page">
      <span className="eyebrow">Rugby résumé</span>
      <p className="rs-onboard-page__later">
        Optional — you can{' '}
        <Link to={homePathForRole(role)}>skip for now</Link> and finish from
        Profile later.
      </p>
      <RefereeOnboarding />
    </div>
  )
}
