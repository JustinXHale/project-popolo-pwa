import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import {
  AppleSignInButton,
  GoogleSignInButton,
} from '../components/auth/SocialSignInButtons'
import { useAuth } from '../context/auth-context'
import {
  ROLE_LABELS,
  homePathForRole,
  safeNextPath,
} from '../types/models'
import './AuthPages.css'

export function LoginPage() {
  const {
    user,
    profile,
    role,
    loading,
    needsOnboarding,
    isDemoAuth,
    authError,
    signInWithGoogle,
    signInWithApple,
    signOut,
    clearAuthError,
  } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [pending, setPending] = useState<string | null>(null)

  if (!loading && user && next) {
    return <Navigate to={safeNextPath(next, role)} replace />
  }

  if (!loading && user && profile) {
    return (
      <div className="container section auth-page">
        <h1>Your account</h1>
        <p>
          Signed in as{' '}
          <strong>
            {profile.firstName} {profile.lastName}
          </strong>{' '}
          ({user.email}) · {ROLE_LABELS[role]}
        </p>
        {needsOnboarding && role === 'referee' ? (
          <p>
            Finish your referee profile when you are ready. It becomes the start
            of your rugby résumé.
          </p>
        ) : null}
        <div className="auth-page__actions">
          <ButtonLink to={homePathForRole(role)}>Continue</ButtonLink>
          {role === 'referee' ? (
            <ButtonLink
              to="/onboarding"
              variant={needsOnboarding ? 'secondary' : 'ghost'}
            >
              {needsOnboarding ? 'Complete onboarding' : 'Update rugby résumé'}
            </ButtonLink>
          ) : null}
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  async function handleSocial(provider: 'google' | 'apple') {
    clearAuthError()
    setPending(provider)
    try {
      const signedIn =
        provider === 'google'
          ? await signInWithGoogle()
          : await signInWithApple()
      if (!signedIn) setPending(null)
    } catch {
      setPending(null)
    }
  }

  return (
    <div className="container section auth-page">
      <h1>Sign in</h1>
      <p>
        Referees, coaches, and admins use the same sign-in. Coach and admin
        access is appointed — you cannot choose those roles here.
      </p>
      {isDemoAuth ? (
        <div className="auth-page__demo">
          <p>
            Demo mode — Firebase keys are not set. Either provider will open a
            local referee account.
          </p>
        </div>
      ) : null}
      {authError ? (
        <p className="auth-page__error" role="alert">
          {authError}
        </p>
      ) : null}
      {loading ? (
        <p>Checking session…</p>
      ) : (
        <div className="auth-page__providers" role="group" aria-label="Sign in">
          <GoogleSignInButton
            busy={pending === 'google'}
            disabled={pending !== null}
            onClick={() => void handleSocial('google')}
          />
          <AppleSignInButton
            busy={pending === 'apple'}
            disabled={pending !== null}
            onClick={() => void handleSocial('apple')}
          />
        </div>
      )}
      <p className="auth-page__fine">
        By continuing you agree to the <Link to="/terms">Terms</Link> and{' '}
        <Link to="/privacy">Privacy</Link> notices.
      </p>
    </div>
  )
}

