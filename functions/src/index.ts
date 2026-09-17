import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2'

setGlobalOptions({ region: 'us-central1' })

initializeApp()
const db = getFirestore()
const auth = getAuth()

const MASTER_ADMIN_EMAIL = (
  process.env.MASTER_ADMIN_EMAIL || ''
).trim().toLowerCase()

async function requireAdmin(uid: string | undefined) {
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.')
  const snap = await db.doc(`users/${uid}`).get()
  if (snap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only.')
  }
}

function isMasterEmail(email: string | undefined | null) {
  if (!MASTER_ADMIN_EMAIL || !email) return false
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL
}

export const promoteMasterAdmin = onDocumentCreated(
  'users/{uid}',
  async (event) => {
    const data = event.data?.data()
    if (!isMasterEmail(String(data?.email || ''))) return
    await event.data?.ref.set(
      {
        role: 'admin',
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )
  },
)

export const setUserRole = onCall(async (request) => {
  await requireAdmin(request.auth?.uid)
  const { uid, role } = request.data ?? {}
  const allowed = ['admin', 'coach', 'referee']
  if (typeof uid !== 'string' || !allowed.includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid uid or role.')
  }
  const target = await db.doc(`users/${uid}`).get()
  if (!target.exists) {
    throw new HttpsError('not-found', 'User not found.')
  }
  const targetEmail = String(target.data()?.email || '').toLowerCase()
  if (isMasterEmail(targetEmail) && role !== 'admin') {
    throw new HttpsError(
      'failed-precondition',
      'The master admin cannot be demoted.',
    )
  }
  await db.doc(`users/${uid}`).set(
    {
      role,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
  return { ok: true }
})

async function deleteUserTree(uid: string) {
  const profiles = await db
    .collection('refereeProfiles')
    .where('ownerUid', '==', uid)
    .get()
  const profileIds = profiles.docs.map((d) => d.id)

  const batchDelete = async (
    col: string,
    field: string,
    value: string,
  ) => {
    const snap = await db.collection(col).where(field, '==', value).get()
    const writes = snap.docs.map((d) => d.ref.delete())
    await Promise.all(writes)
  }

  await Promise.all(profiles.docs.map((d) => d.ref.delete()))
  await batchDelete('games', 'createdByUid', uid)
  await batchDelete('documents', 'uploadedByUid', uid)
  await batchDelete('mediaSubmissions', 'ownerUid', uid)
  await batchDelete('eventApplications', 'submittedByUid', uid)

  for (const id of profileIds) {
    await batchDelete('games', 'refereeId', id)
    await batchDelete('documents', 'refereeId', id)
  }

  await db.doc(`users/${uid}`).delete()

  const bucket = getStorage().bucket()
  await Promise.all([
    bucket.deleteFiles({ prefix: `headshots/${uid}/` }),
    bucket.deleteFiles({ prefix: `docs/${uid}/` }),
    bucket.deleteFiles({ prefix: `media/${uid}/` }),
  ])

  await auth.deleteUser(uid)
}

export const deleteMyAccount = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.')
  const snap = await db.doc(`users/${uid}`).get()
  if (isMasterEmail(String(snap.data()?.email || ''))) {
    throw new HttpsError(
      'failed-precondition',
      'The master admin cannot delete this account from the app.',
    )
  }
  await deleteUserTree(uid)
  return { ok: true }
})

export const deleteUserAccount = onCall(async (request) => {
  await requireAdmin(request.auth?.uid)
  const { uid } = request.data ?? {}
  if (typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'uid required.')
  }
  if (uid === request.auth?.uid) {
    throw new HttpsError(
      'failed-precondition',
      'Use deleteMyAccount to remove your own account.',
    )
  }
  const snap = await db.doc(`users/${uid}`).get()
  if (isMasterEmail(String(snap.data()?.email || ''))) {
    throw new HttpsError(
      'failed-precondition',
      'The master admin cannot be deleted.',
    )
  }
  await deleteUserTree(uid)
  return { ok: true }
})
