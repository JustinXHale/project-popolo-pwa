import { createContext, useContext } from 'react'
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
  UserDoc,
  UserRole,
} from '../types/models'

export interface PopoloData {
  users: UserDoc[]
  profiles: RefereeProfileDoc[]
  games: GameDoc[]
  documents: DocumentDoc[]
  media: MediaSubmissionDoc[]
  requests: ServiceRequestDoc[]
  messages: ContactMessageDoc[]
  eventApplications: EventApplicationDoc[]
  eventApplicationForms: EventApplicationFormDoc[]
  sitePages: Record<SitePageKey, boolean>
}

export interface DataContextValue extends PopoloData {
  loading: boolean
  upsertProfile: (profile: RefereeProfileDoc) => Promise<void>
  saveGame: (game: GameDoc) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  saveDocument: (doc: DocumentDoc) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  saveMedia: (item: MediaSubmissionDoc) => Promise<void>
  updateMediaStatus: (
    id: string,
    status: MediaSubmissionDoc['status'],
  ) => Promise<void>
  submitRequest: (item: ServiceRequestDoc) => Promise<void>
  updateRequestStatus: (id: string, status: RequestStatus) => Promise<void>
  submitEventApplication: (item: EventApplicationDoc) => Promise<void>
  updateEventApplicationStatus: (
    id: string,
    status: EventApplicationStatus,
  ) => Promise<void>
  saveEventApplicationForm: (form: EventApplicationFormDoc) => Promise<void>
  updateSitePages: (
    pages: Partial<Record<SitePageKey, boolean>>,
  ) => Promise<void>
  submitContact: (item: ContactMessageDoc) => Promise<void>
  setUserRole: (uid: string, role: UserRole) => Promise<void>
  deleteAccount: (uid: string) => Promise<void>
  uploadBlob: (path: string, blob: Blob) => Promise<string>
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
