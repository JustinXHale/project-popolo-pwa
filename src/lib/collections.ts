import {
  collection,
  type CollectionReference,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  ContactMessageDoc,
  DocumentDoc,
  EventApplicationDoc,
  GameDoc,
  MediaSubmissionDoc,
  RefereeProfileDoc,
  ServiceRequestDoc,
  UserDoc,
} from '../types/models'

export const cols = {
  users: collection(db, 'users') as CollectionReference<UserDoc>,
  refereeProfiles: collection(
    db,
    'refereeProfiles',
  ) as CollectionReference<RefereeProfileDoc>,
  games: collection(db, 'games') as CollectionReference<GameDoc>,
  documents: collection(db, 'documents') as CollectionReference<DocumentDoc>,
  mediaSubmissions: collection(
    db,
    'mediaSubmissions',
  ) as CollectionReference<MediaSubmissionDoc>,
  serviceRequests: collection(
    db,
    'serviceRequests',
  ) as CollectionReference<ServiceRequestDoc>,
  contactMessages: collection(
    db,
    'contactMessages',
  ) as CollectionReference<ContactMessageDoc>,
  eventApplications: collection(
    db,
    'eventApplications',
  ) as CollectionReference<EventApplicationDoc>,
}
