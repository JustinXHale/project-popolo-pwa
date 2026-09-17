import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  type AuthProvider,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')

const appleProvider = new OAuthProvider('apple.com')
appleProvider.addScope('email')
appleProvider.addScope('name')

function isMobileClient(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true
  return navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)
}

function isPopupBlockedError(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''
  return (
    code === 'auth/popup-blocked' ||
    (err instanceof Error &&
      /popup/i.test(err.message) &&
      /blocked/i.test(err.message))
  )
}

async function signInWithProvider(
  provider: AuthProvider,
): Promise<User | null> {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase Auth is not configured. Check VITE_FIREBASE_* in .env.local.',
    )
  }
  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (err) {
    if (isPopupBlockedError(err) && isMobileClient()) {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw err
  }
}

export async function signInWithGooglePopup(): Promise<User | null> {
  return signInWithProvider(googleProvider)
}

export async function signInWithApplePopup(): Promise<User | null> {
  return signInWithProvider(appleProvider)
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Auth is not configured.')
  }
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Auth is not configured.')
  }
  const result = await createUserWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function completeRedirectSignIn(): Promise<User | null> {
  if (!isFirebaseConfigured) return null
  const result = await getRedirectResult(auth)
  return result?.user ?? null
}

export function authErrorMessage(
  provider: 'Google' | 'Apple' | 'Email',
  err: unknown,
): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''
  const message =
    err instanceof Error ? err.message : `${provider} sign-in failed.`

  if (code === 'auth/operation-not-allowed') {
    return `${provider} sign-in is not enabled yet.`
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in was cancelled.'
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up blocked. Allow pop-ups for this site, then try again.'
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Firebase Auth.'
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account already exists for that email. Sign in instead.'
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Email or password is incorrect.'
  }
  if (code === 'auth/weak-password') {
    return 'Use a password of at least 6 characters.'
  }
  return message
}
