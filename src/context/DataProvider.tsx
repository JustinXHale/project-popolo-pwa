import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { httpsCallable } from 'firebase/functions'
import { db, functions, isDemoMode, storage } from '../lib/firebase'
import { cols } from '../lib/collections'
import { SEED_DOCUMENTS, SEED_GAMES, SEED_PROFILES } from '../lib/seed'
import { DataContext, type PopoloData } from './data-context'
import { useAuth } from './auth-context'
import { isStaff, mergeSitePages } from '../types/models'
import { stripUndefined } from '../lib/stripUndefined'
import type {
  ContactMessageDoc,
  DocumentDoc,
  EventApplicationDoc,
  EventApplicationFormDoc,
  EventApplicationStatus,
  GameDoc,
  MediaSubmissionDoc,
  RefereeProfileDoc,
  RequestStatus,
  ServiceRequestDoc,
  SitePageKey,
  UserRole,
} from '../types/models'

const DEMO_DATA_KEY = 'popolo.demoData'

function emptyData(): PopoloData {
  return {
    users: [],
    profiles: SEED_PROFILES,
    games: SEED_GAMES,
    documents: SEED_DOCUMENTS,
    media: [],
    requests: [],
    messages: [],
    eventApplications: [],
    eventApplicationForms: [],
    sitePages: mergeSitePages(),
  }
}

function readDemo(): PopoloData {
  try {
    const raw = localStorage.getItem(DEMO_DATA_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<PopoloData>
    return {
      users: parsed.users ?? [],
      profiles: parsed.profiles?.length ? parsed.profiles : SEED_PROFILES,
      games: parsed.games ?? SEED_GAMES,
      documents: parsed.documents ?? [],
      media: parsed.media ?? [],
      requests: parsed.requests ?? [],
      messages: parsed.messages ?? [],
      eventApplications: parsed.eventApplications ?? [],
      eventApplicationForms: parsed.eventApplicationForms ?? [],
      sitePages: mergeSitePages(parsed.sitePages),
    }
  } catch {
    return emptyData()
  }
}

function writeDemo(data: PopoloData) {
  localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data))
}

export function DataProvider({ children }: { children: ReactNode }) {
  const demo = isDemoMode()
  const { user, profile, role, signOut } = useAuth()
  const staff = isStaff(role) && Boolean(profile?.onboardingComplete)
  const [data, setData] = useState<PopoloData>(emptyData)
  const [loading, setLoading] = useState(!demo)

  useEffect(() => {
    if (!demo) return
    setData(readDemo())
    setLoading(false)
  }, [demo])

  useEffect(() => {
    if (!demo || !profile) return
    setData((prev) => {
      const users = prev.users.some((u) => u.uid === profile.uid)
        ? prev.users.map((u) => (u.uid === profile.uid ? profile : u))
        : [...prev.users, profile]
      const next = { ...prev, users }
      writeDemo(next)
      return next
    })
  }, [demo, profile])

  useEffect(() => {
    if (demo) return
    const published = where('published', '==', true)
    const unsub: Array<() => void> = []

    unsub.push(
      onSnapshot(
        staff ? cols.refereeProfiles : query(cols.refereeProfiles, published),
        (snap) => {
          const publishedProfiles = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as RefereeProfileDoc[]
          setData((prev) => {
            const unpublishedOwn =
              user && !staff
                ? prev.profiles.filter(
                    (p) =>
                      p.ownerUid === user.uid &&
                      !publishedProfiles.some((item) => item.id === p.id),
                  )
                : []
            return {
              ...prev,
              profiles: [...publishedProfiles, ...unpublishedOwn],
            }
          })
          setLoading(false)
        },
        () => setLoading(false),
      ),
    )
    if (user && !staff) {
      unsub.push(
        onSnapshot(
          query(cols.refereeProfiles, where('ownerUid', '==', user.uid)),
          (snap) => {
            const mine = snap.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            })) as RefereeProfileDoc[]
            setData((prev) => {
              const others = prev.profiles.filter(
                (p) => p.ownerUid !== user.uid,
              )
              return { ...prev, profiles: [...others, ...mine] }
            })
          },
        ),
      )
    }
    unsub.push(
      onSnapshot(
        staff ? cols.games : query(cols.games, published),
        (snap) => {
          setData((prev) => ({
            ...prev,
            games: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          }))
        },
      ),
    )
    unsub.push(
      onSnapshot(
        staff ? cols.documents : query(cols.documents, published),
        (snap) => {
          setData((prev) => ({
            ...prev,
            documents: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          }))
        },
      ),
    )

    if (staff || user) {
      unsub.push(
        onSnapshot(cols.mediaSubmissions, (snap) => {
          setData((prev) => ({
            ...prev,
            media: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          }))
        }),
      )
    }
    unsub.push(
      onSnapshot(doc(db, 'siteSettings', 'public'), (snap) => {
        setData((prev) => ({
          ...prev,
          sitePages: mergeSitePages(
            snap.data()?.pages as Partial<Record<SitePageKey, boolean>> | undefined,
          ),
        }))
      }),
    )

    unsub.push(
      onSnapshot(cols.eventApplicationForms, (snap) => {
        setData((prev) => ({
          ...prev,
          eventApplicationForms: snap.docs.map((item) => ({
            ...item.data(),
            eventSlug: item.id,
          })),
        }))
      }),
    )

    if (staff) {
      unsub.push(
        onSnapshot(cols.eventApplications, (snap) => {
          setData((prev) => ({
            ...prev,
            eventApplications: snap.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            })),
          }))
        }),
      )
    } else if (user) {
      unsub.push(
        onSnapshot(
          query(cols.eventApplications, where('submittedByUid', '==', user.uid)),
          (snap) => {
            setData((prev) => ({
              ...prev,
              eventApplications: snap.docs.map((d) => ({
                ...d.data(),
                id: d.id,
              })),
            }))
          },
        ),
      )
    }

    if (staff) {
      unsub.push(
        onSnapshot(cols.serviceRequests, (snap) => {
          setData((prev) => ({
            ...prev,
            requests: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          }))
        }),
      )
      unsub.push(
        onSnapshot(cols.contactMessages, (snap) => {
          setData((prev) => ({
            ...prev,
            messages: snap.docs.map((d) => ({ ...d.data(), id: d.id })),
          }))
        }),
      )
      unsub.push(
        onSnapshot(cols.users, (snap) => {
          setData((prev) => ({
            ...prev,
            users: snap.docs.map((d) => ({ ...d.data(), uid: d.id })),
          }))
        }),
      )
    }

    return () => unsub.forEach((fn) => fn())
  }, [demo, staff, user])

  const patch = useCallback(
    (updater: (prev: PopoloData) => PopoloData) => {
      setData((prev) => {
        const next = updater(prev)
        if (demo) writeDemo(next)
        return next
      })
    },
    [demo],
  )

  const upsertProfile = useCallback(
    async (next: RefereeProfileDoc) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          profiles: prev.profiles.some((p) => p.id === next.id)
            ? prev.profiles.map((p) => (p.id === next.id ? next : p))
            : [...prev.profiles, next],
        }))
        return
      }
      await setDoc(doc(db, 'refereeProfiles', next.id), next)
      patch((prev) => ({
        ...prev,
        profiles: prev.profiles.some((p) => p.id === next.id)
          ? prev.profiles.map((p) => (p.id === next.id ? next : p))
          : [...prev.profiles, next],
      }))
    },
    [demo, patch],
  )

  const saveGame = useCallback(
    async (game: GameDoc) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          games: prev.games.some((g) => g.id === game.id)
            ? prev.games.map((g) => (g.id === game.id ? game : g))
            : [...prev.games, game],
        }))
        return
      }
      await setDoc(doc(db, 'games', game.id), game)
    },
    [demo, patch],
  )

  const deleteGame = useCallback(
    async (id: string) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          games: prev.games.filter((g) => g.id !== id),
        }))
        return
      }
      await deleteDoc(doc(db, 'games', id))
    },
    [demo, patch],
  )

  const saveDocument = useCallback(
    async (item: DocumentDoc) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          documents: prev.documents.some((d) => d.id === item.id)
            ? prev.documents.map((d) => (d.id === item.id ? item : d))
            : [...prev.documents, item],
        }))
        return
      }
      await setDoc(doc(db, 'documents', item.id), item)
    },
    [demo, patch],
  )

  const deleteDocument = useCallback(
    async (id: string) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          documents: prev.documents.filter((d) => d.id !== id),
        }))
        return
      }
      const existing = data.documents.find((d) => d.id === id)
      if (existing?.storagePath) {
        try {
          await deleteObject(ref(storage, existing.storagePath))
        } catch {
          /* ignore */
        }
      }
      await deleteDoc(doc(db, 'documents', id))
    },
    [demo, patch, data.documents],
  )

  const saveMedia = useCallback(
    async (item: MediaSubmissionDoc) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          media: [item, ...prev.media.filter((m) => m.id !== item.id)],
        }))
        return
      }
      await setDoc(doc(db, 'mediaSubmissions', item.id), item)
    },
    [demo, patch],
  )

  const updateMediaStatus = useCallback(
    async (id: string, status: MediaSubmissionDoc['status']) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          media: prev.media.map((m) =>
            m.id === id
              ? { ...m, status, updatedAt: new Date().toISOString() }
              : m,
          ),
        }))
        return
      }
      await updateDoc(doc(db, 'mediaSubmissions', id), {
        status,
        updatedAt: new Date().toISOString(),
      })
    },
    [demo, patch],
  )

  const submitRequest = useCallback(
    async (item: ServiceRequestDoc) => {
      if (item.honeypot) return
      if (demo) {
        patch((prev) => ({ ...prev, requests: [item, ...prev.requests] }))
        return
      }
      const { id: _omit, ...rest } = item
      void _omit
      await addDoc(cols.serviceRequests, rest as ServiceRequestDoc)
    },
    [demo, patch],
  )

  const updateRequestStatus = useCallback(
    async (id: string, status: RequestStatus) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          requests: prev.requests.map((r) =>
            r.id === id
              ? { ...r, status, updatedAt: new Date().toISOString() }
              : r,
          ),
        }))
        return
      }
      await updateDoc(doc(db, 'serviceRequests', id), {
        status,
        updatedAt: new Date().toISOString(),
      })
    },
    [demo, patch],
  )

  const submitEventApplication = useCallback(
    async (item: EventApplicationDoc) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          eventApplications: [item, ...prev.eventApplications],
        }))
        return
      }
      const { id: _omit, ...rest } = item
      void _omit
      await addDoc(
        cols.eventApplications,
        stripUndefined(rest) as EventApplicationDoc,
      )
    },
    [demo, patch],
  )

  const updateEventApplicationStatus = useCallback(
    async (id: string, status: EventApplicationStatus) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          eventApplications: prev.eventApplications.map((app) =>
            app.id === id
              ? { ...app, status, updatedAt: new Date().toISOString() }
              : app,
          ),
        }))
        return
      }
      await updateDoc(doc(db, 'eventApplications', id), {
        status,
        updatedAt: new Date().toISOString(),
      })
    },
    [demo, patch],
  )

  const saveEventApplicationForm = useCallback(
    async (form: EventApplicationFormDoc) => {
      const next = { ...form, updatedAt: new Date().toISOString() }
      if (demo) {
        patch((prev) => ({
          ...prev,
          eventApplicationForms: [
            next,
            ...prev.eventApplicationForms.filter(
              (item) => item.eventSlug !== next.eventSlug,
            ),
          ],
        }))
        return
      }
      await setDoc(
        doc(db, 'eventApplicationForms', next.eventSlug),
        stripUndefined(next),
      )
    },
    [demo, patch],
  )

  const updateSitePages = useCallback(
    async (pages: Partial<Record<SitePageKey, boolean>>) => {
      const apply = (prev: PopoloData) => ({
        ...prev,
        sitePages: mergeSitePages({ ...prev.sitePages, ...pages }),
      })
      if (demo) {
        patch(apply)
        return
      }
      const nextPages = mergeSitePages({ ...data.sitePages, ...pages })
      await setDoc(
        doc(db, 'siteSettings', 'public'),
        {
          pages: nextPages,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
      patch(apply)
    },
    [demo, patch, data.sitePages],
  )

  const submitContact = useCallback(
    async (item: ContactMessageDoc) => {
      if (item.honeypot) return
      if (demo) {
        patch((prev) => ({ ...prev, messages: [item, ...prev.messages] }))
        return
      }
      const { id: _omit, ...rest } = item
      void _omit
      await addDoc(cols.contactMessages, rest as ContactMessageDoc)
    },
    [demo, patch],
  )

  const setUserRoleFn = useCallback(
    async (uid: string, nextRole: UserRole) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.uid === uid
              ? { ...u, role: nextRole, updatedAt: new Date().toISOString() }
              : u,
          ),
        }))
        return
      }
      await httpsCallable(functions, 'setUserRole')({ uid, role: nextRole })
    },
    [demo, patch],
  )

  const deleteAccount = useCallback(
    async (uid: string) => {
      if (demo) {
        patch((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.uid !== uid),
          profiles: prev.profiles.filter((p) => p.ownerUid !== uid),
          games: prev.games.filter((g) => g.createdByUid !== uid),
          documents: prev.documents.filter((d) => d.uploadedByUid !== uid),
          media: prev.media.filter((m) => m.ownerUid !== uid),
          eventApplications: prev.eventApplications.filter(
            (app) => app.submittedByUid !== uid,
          ),
        }))
        if (user?.uid === uid) await signOut()
        return
      }
      const name =
        user?.uid === uid ? 'deleteMyAccount' : 'deleteUserAccount'
      await httpsCallable(
        functions,
        name,
      )(user?.uid === uid ? {} : { uid })
      if (user?.uid === uid) await signOut()
    },
    [demo, patch, user, signOut],
  )

  const uploadBlob = useCallback(
    async (path: string, blob: Blob) => {
      if (demo) return URL.createObjectURL(blob)
      const fileRef = ref(storage, path)
      await uploadBytes(fileRef, blob)
      return getDownloadURL(fileRef)
    },
    [demo],
  )

  const value = useMemo(
    () => ({
      ...data,
      loading,
      upsertProfile,
      saveGame,
      deleteGame,
      saveDocument,
      deleteDocument,
      saveMedia,
      updateMediaStatus,
      submitRequest,
      updateRequestStatus,
      submitEventApplication,
      updateEventApplicationStatus,
      saveEventApplicationForm,
      updateSitePages,
      submitContact,
      setUserRole: setUserRoleFn,
      deleteAccount,
      uploadBlob,
    }),
    [
      data,
      loading,
      upsertProfile,
      saveGame,
      deleteGame,
      saveDocument,
      deleteDocument,
      saveMedia,
      updateMediaStatus,
      submitRequest,
      updateRequestStatus,
      submitEventApplication,
      updateEventApplicationStatus,
      saveEventApplicationForm,
      updateSitePages,
      submitContact,
      setUserRoleFn,
      deleteAccount,
      uploadBlob,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
