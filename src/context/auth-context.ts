import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserDoc, UserRole } from '../types/models'

export interface OnboardingInput {
  firstName: string
  lastName: string
  birthday: string
}

export type DemoSignInRole = UserRole

export interface AuthContextValue {
  user: User | null
  profile: UserDoc | null
  role: UserRole
  loading: boolean
  needsOnboarding: boolean
  isDemoAuth: boolean
  authError: string | null
  signInWithGoogle: () => Promise<User | null>
  signInWithApple: () => Promise<User | null>
  signInWithEmailPassword: (
    email: string,
    password: string,
  ) => Promise<User | null>
  registerWithEmailPassword: (
    email: string,
    password: string,
  ) => Promise<User | null>
  signInDemoAs: (role: DemoSignInRole) => Promise<User | null>
  completeOnboarding: (input: OnboardingInput) => Promise<void>
  clearAuthError: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
