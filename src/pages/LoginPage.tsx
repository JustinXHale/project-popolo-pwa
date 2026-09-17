import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import { Field, TextInput } from '../components/ui/Field'
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
    signInWithEmailPassword,
    registerWithEmailPassword,
    signInDemoAs,
    signOut,
    clearAuthError,
  } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [pending, setPending] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

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

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    clearAuthError()
    setPending('email')
    try {
      if (mode === 'register') {
        await registerWithEmailPassword(email, password)
      } else {
        await signInWithEmailPassword(email, password)
      }
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
          <p>Demo mode — Firebase keys are not set. Try a local role:</p>
          <div className="auth-page__actions">
            <Button size="sm" onClick={() => void signInDemoAs('referee')}>
              Referee
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void signInDemoAs('coach')}
            >
              Coach
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void signInDemoAs('admin')}
            >
              Admin
            </Button>
          </div>
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
        <>
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
          <form className="auth-page__form" onSubmit={(e) => void handleEmail(e)}>
            <Field label="Email" htmlFor="email">
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Button type="submit" disabled={pending !== null}>
              {mode === 'register' ? 'Create account' : 'Sign in with email'}
            </Button>
            <p className="auth-page__fine">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() =>
                  setMode((m) => (m === 'signin' ? 'register' : 'signin'))
                }
              >
                {mode === 'register'
                  ? 'Already have an account? Sign in'
                  : 'Need an account? Register'}
              </button>
            </p>
          </form>
        </>
      )}
      <p className="auth-page__fine">
        By continuing you agree to the <Link to="/terms">Terms</Link> and{' '}
        <Link to="/privacy">Privacy</Link> notices.
      </p>
    </div>
  )
}

