import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db, isDemoMode, masterAdminEmail } from '../lib/firebase'
import {
  authErrorMessage,
  completeRedirectSignIn,
  signInWithApplePopup,
  signInWithGooglePopup,
} from '../lib/authSignIn'
import {
  AuthContext,
  type OnboardingInput,
} from './auth-context'
import {
  splitDisplayName,
  isAtLeast18,
  type UserDoc,
  type UserRole,
} from '../types/models'

const DEMO_PROFILE_KEY = 'popolo.demoAuthProfile'

function normalizeRole(raw: unknown): UserRole {
  if (raw === 'admin') return 'admin'
  if (raw === 'coach') return 'coach'
  return 'referee'
}

function isMaster(email: string | null | undefined): boolean {
  if (!masterAdminEmail || !email) return false
  return email.trim().toLowerCase() === masterAdminEmail
}

function accountLoadErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : ''
  const message = err instanceof Error ? err.message : ''

  if (
    code === 'unavailable' ||
    /offline/i.test(message) ||
    /Firestore API has not been used/i.test(message)
  ) {
    return 'Firestore is not set up yet. In Firebase Console → Firestore Database, create the database for rabbitholeapps, then run npm run deploy:rules.'
  }
  if (code === 'permission-denied') {
    return 'Firestore denied access. Run npm run deploy:rules, then sign in again.'
  }
  return 'Could not load your account. Try signing in again.'
}

function profileFromFirestore(
  data: Record<string, unknown>,
  uid: string,
): UserDoc {
  const displayName = (data.displayName as string | null) ?? null
  const joined = [data.firstName, data.lastName].filter(Boolean).join(' ')
  const names = splitDisplayName(displayName || joined || null)
  return {
    uid,
    email: (data.email as string | null) ?? null,
    displayName,
    firstName: (data.firstName as string) || names.firstName,
    lastName: (data.lastName as string) || names.lastName,
    photoURL: (data.photoURL as string | null) ?? null,
    role: normalizeRole(data.role),
    onboardingComplete: Boolean(data.onboardingComplete),
    birthday: (data.birthday as string | undefined) || undefined,
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    updatedAt: (data.updatedAt as string) || new Date().toISOString(),
  }
}

async function ensureUserProfile(user: User): Promise<UserDoc> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const existing = profileFromFirestore(
      snap.data() as Record<string, unknown>,
      user.uid,
    )
    if (isMaster(existing.email) && existing.role !== 'admin') {
      return {
        ...existing,
        role: 'admin',
        onboardingComplete: true,
      }
    }
    return existing
  }

  const names = splitDisplayName(user.displayName)
  const master = isMaster(user.email)
  const profile: UserDoc = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    firstName: names.firstName,
    lastName: names.lastName,
    photoURL: user.photoURL,
    role: 'referee',
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  if (master) {
    return { ...profile, role: 'admin', onboardingComplete: true }
  }
  return profile
}

function readDemoProfile(): UserDoc | null {
  try {
    const raw = localStorage.getItem(DEMO_PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserDoc
  } catch {
    return null
  }
}

function writeDemoProfile(profile: UserDoc | null) {
  if (!profile) {
    localStorage.removeItem(DEMO_PROFILE_KEY)
    return
  }
  localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile))
}

function makeDemoUser(profile: UserDoc): User {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName:
      profile.displayName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      null,
    photoURL: profile.photoURL,
  } as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = isDemoMode()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (demo) {
      const existing = readDemoProfile()
      if (existing) {
        setProfile(existing)
        setUser(makeDemoUser(existing))
      }
      setLoading(false)
      return
    }

    let cancelled = false
    void completeRedirectSignIn().catch((err) => {
      console.error(err)
      if (!cancelled) setAuthError(authErrorMessage('Google', err))
    })

    const unsub = onAuthStateChanged(auth, async (next) => {
      setLoading(true)
      try {
        if (!next) {
          if (!cancelled) {
            setUser(null)
            setProfile(null)
          }
          return
        }
        const nextProfile = await ensureUserProfile(next)
        if (!cancelled) {
          setUser(next)
          setProfile(nextProfile)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setAuthError(accountLoadErrorMessage(err))
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [demo])

  const persistDemo = useCallback((next: UserDoc) => {
    writeDemoProfile(next)
    setProfile(next)
    setUser(makeDemoUser(next))
    return makeDemoUser(next)
  }, [])

  const signInDemoAs = useCallback(
    async (role: UserRole) => {
      setAuthError(null)
      const names =
        role === 'admin'
          ? { firstName: 'Jordan', lastName: 'Admin' }
          : role === 'coach'
            ? { firstName: 'Casey', lastName: 'Coach' }
            : { firstName: 'Riley', lastName: 'Referee' }
      const next: UserDoc = {
        uid: `demo-${role}`,
        email: `${role}@projectpopolo.demo`,
        displayName: `${names.firstName} ${names.lastName}`,
        firstName: names.firstName,
        lastName: names.lastName,
        photoURL: null,
        role,
        onboardingComplete: role !== 'referee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return persistDemo(next)
    },
    [persistDemo],
  )

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    if (demo) return signInDemoAs('referee')
    try {
      return await signInWithGooglePopup()
    } catch (err) {
      setAuthError(authErrorMessage('Google', err))
      throw err
    }
  }, [demo, signInDemoAs])

  const signInWithApple = useCallback(async () => {
    setAuthError(null)
    if (demo) return signInDemoAs('referee')
    try {
      return await signInWithApplePopup()
    } catch (err) {
      setAuthError(authErrorMessage('Apple', err))
      throw err
    }
  }, [demo, signInDemoAs])

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      if (!user || !profile) {
        throw new Error('Sign in before completing onboarding.')
      }
      const firstName = input.firstName.trim()
      const lastName = input.lastName.trim()
      if (!firstName || !lastName) {
        throw new Error('First and last name are required.')
      }
      if (!isAtLeast18(input.birthday)) {
        throw new Error('Officials must be 18 or older.')
      }
      const role: UserRole = isMaster(profile.email) ? 'admin' : profile.role
      const next: UserDoc = {
        ...profile,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        birthday: input.birthday,
        role,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      }
      if (demo) {
        persistDemo(next)
        return
      }
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        displayName: next.displayName,
        birthday: input.birthday,
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      })
      setProfile(next)
    },
    [user, profile, demo, persistDemo],
  )

  const refreshProfile = useCallback(async () => {
    if (demo || !user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      setProfile(
        profileFromFirestore(snap.data() as Record<string, unknown>, user.uid),
      )
    }
  }, [demo, user])

  const signOut = useCallback(async () => {
    setAuthError(null)
    if (demo) {
      writeDemoProfile(null)
      setUser(null)
      setProfile(null)
      return
    }
    await firebaseSignOut(auth)
  }, [demo])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const role: UserRole = profile?.role ?? 'referee'
  const needsOnboarding = Boolean(user && profile && !profile.onboardingComplete)

  const value = useMemo(
    () => ({
      user,
      profile,
      role,
      loading,
      needsOnboarding,
      isDemoAuth: demo,
      authError,
      signInWithGoogle,
      signInWithApple,
      completeOnboarding,
      clearAuthError,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      role,
      loading,
      needsOnboarding,
      demo,
      authError,
      signInWithGoogle,
      signInWithApple,
      completeOnboarding,
      clearAuthError,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
