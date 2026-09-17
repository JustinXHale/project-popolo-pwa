import type { DocumentData } from 'firebase/firestore'

/** Firestore rejects `undefined` field values. */
export function stripUndefined(data: object): DocumentData {
  const out: DocumentData = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    out[key] = value
  }
  return out
}
