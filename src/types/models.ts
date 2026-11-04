/** Primary app roles. Admin and coach are never self-selected. */
export type UserRole = 'admin' | 'coach' | 'referee'

export type SelfServeRole = 'referee'

export const SELF_SERVE_ROLES: SelfServeRole[] = ['referee']

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  coach: 'Coach',
  referee: 'Referee',
}

export type MatchFormat =
  | 'fifteens'
  | 'sevens'
  | 'tens'
  | 'rugbyLeague'
  | 'touch'

export const MATCH_FORMATS: MatchFormat[] = [
  'fifteens',
  'sevens',
  'tens',
  'rugbyLeague',
  'touch',
]

export const MATCH_FORMAT_LABELS: Record<MatchFormat, string> = {
  fifteens: 'XVs',
  sevens: '7s',
  tens: '10s',
  rugbyLeague: 'Rugby League',
  touch: 'Touch Rugby',
}

export function parseEventMatchFormat(value?: string): MatchFormat {
  const normalized = (value || '').trim().toLowerCase()
  if (/(15|xv|fifteen)/.test(normalized)) return 'fifteens'
  if (/(10|ten)/.test(normalized)) return 'tens'
  if (/league/.test(normalized)) return 'rugbyLeague'
  if (/touch/.test(normalized)) return 'touch'
  return 'sevens'
}

export function eventExperienceNoun(format: MatchFormat): string {
  if (format === 'fifteens') return 'fifteens'
  if (format === 'tens') return 'tens'
  if (format === 'rugbyLeague') return 'rugby league'
  if (format === 'touch') return 'touch'
  return 'sevens'
}

export type CompetitionLevel =
  | 'local'
  | 'regional'
  | 'national'
  | 'international'

export const COMPETITION_LEVELS: CompetitionLevel[] = [
  'local',
  'regional',
  'national',
  'international',
]

export const COMPETITION_LEVEL_LABELS: Record<CompetitionLevel, string> = {
  local: 'Local',
  regional: 'Regional',
  national: 'National',
  international: 'International',
}

export type MatchGender =
  | 'men'
  | 'women'
  | 'boysU18'
  | 'girlsU18'
  | 'youth'

export const MATCH_GENDERS: MatchGender[] = [
  'men',
  'women',
  'boysU18',
  'girlsU18',
  'youth',
]

export const MATCH_GENDER_LABELS: Record<MatchGender, string> = {
  men: 'Men',
  women: 'Women',
  boysU18: 'Boys U18',
  girlsU18: 'Girls U18',
  youth: 'Youth',
}

export type MatchType =
  | 'professional'
  | 'national'
  | 'regional'
  | 'local'
  | 'college'

export const MATCH_TYPES: MatchType[] = [
  'professional',
  'national',
  'regional',
  'college',
  'local',
]

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  professional: 'Professional',
  national: 'National',
  regional: 'Regional',
  local: 'Local',
  college: 'College',
}

export type MatchDivision =
  | 'd1'
  | 'd1aa'
  | 'd2'
  | 'd3'
  | 'd4'
  | 'varsity'
  | 'jv'

export const COLLEGE_DIVISIONS: MatchDivision[] = ['d1', 'd1aa', 'd2', 'd3']

export const CIRCUIT_DIVISIONS: MatchDivision[] = ['d1', 'd2', 'd3', 'd4']

export const YOUTH_DIVISIONS: MatchDivision[] = ['varsity', 'jv']

export const MATCH_DIVISION_LABELS: Record<MatchDivision, string> = {
  d1: 'D1',
  d1aa: 'D1AA',
  d2: 'D2',
  d3: 'D3',
  d4: 'D4',
  varsity: 'Varsity',
  jv: 'JV',
}

export function isYouthGender(
  gender: MatchGender | '' | undefined,
): boolean {
  return gender === 'boysU18' || gender === 'girlsU18' || gender === 'youth'
}

export function divisionsForMatchType(
  type: MatchType | '' | undefined,
): MatchDivision[] {
  if (type === 'college') return COLLEGE_DIVISIONS
  if (type === 'national' || type === 'regional' || type === 'local') {
    return CIRCUIT_DIVISIONS
  }
  return []
}

export function divisionsForMatch(options: {
  type?: MatchType | ''
  gender?: MatchGender | ''
}): MatchDivision[] {
  if (isYouthGender(options.gender)) return YOUTH_DIVISIONS
  return divisionsForMatchType(options.type)
}

export function matchTypeToCompetitionLevel(
  type: MatchType,
): CompetitionLevel {
  switch (type) {
    case 'professional':
      return 'international'
    case 'national':
    case 'college':
      return 'national'
    case 'regional':
      return 'regional'
    case 'local':
      return 'local'
  }
}

export function formatGameClassification(game: {
  matchType?: MatchType
  division?: MatchDivision | null
  level: CompetitionLevel
}): string {
  const typeLabel = game.matchType
    ? MATCH_TYPE_LABELS[game.matchType]
    : COMPETITION_LEVEL_LABELS[game.level]
  const divisionLabel = game.division
    ? MATCH_DIVISION_LABELS[game.division]
    : ''
  return divisionLabel ? `${typeLabel} · ${divisionLabel}` : typeLabel
}

export type RefereePosition = 'center' | 'ar' | 'tmo' | 'other'

export const REFEREE_POSITIONS: RefereePosition[] = [
  'center',
  'ar',
  'tmo',
  'other',
]

export const REFEREE_POSITION_LABELS: Record<RefereePosition, string> = {
  center: 'Center / match official',
  ar: 'Assistant referee',
  tmo: 'TMO',
  other: 'Other',
}

export type HighestCompetition =
  | 'localClub'
  | 'highSchoolU18'
  | 'collegiate'
  | 'mensWomensQualifiers'
  | 'nationalMensWomens'
  | 'hsbcWorldSeries'
  | 'other'

export const HIGHEST_COMPETITIONS: HighestCompetition[] = [
  'localClub',
  'highSchoolU18',
  'collegiate',
  'mensWomensQualifiers',
  'nationalMensWomens',
  'hsbcWorldSeries',
  'other',
]

export const HIGHEST_COMPETITION_LABELS: Record<HighestCompetition, string> = {
  localClub: 'Local / club',
  highSchoolU18: 'High school / U18',
  collegiate: 'Collegiate',
  mensWomensQualifiers: "Men's or Women's qualifiers",
  nationalMensWomens: "National Men's or Women's",
  hsbcWorldSeries: 'HSBC / World Rugby',
  other: 'Other',
}

export function highestCompetitionLabelsForFormat(
  format: MatchFormat,
): Record<HighestCompetition, string> {
  if (format !== 'fifteens') return HIGHEST_COMPETITION_LABELS
  return {
    ...HIGHEST_COMPETITION_LABELS,
    mensWomensQualifiers: "Men's or Women's championships / qualifiers",
    hsbcWorldSeries: 'Professional / international',
  }
}

export type DocumentType = 'evaluation' | 'coachingReport' | 'other'

export const DOCUMENT_TYPES: DocumentType[] = [
  'evaluation',
  'coachingReport',
  'other',
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  evaluation: 'Evaluation',
  coachingReport: 'Coaching report',
  other: 'Other',
}

export type RequestStatus =
  | 'submitted'
  | 'reviewing'
  | 'accepted'
  | 'declined'

export const REQUEST_STATUSES: RequestStatus[] = [
  'submitted',
  'reviewing',
  'accepted',
  'declined',
]

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Submitted',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  declined: 'Declined',
}

export type MediaStatus = 'submitted' | 'used' | 'archived'

export const MEDIA_STATUSES: MediaStatus[] = [
  'submitted',
  'used',
  'archived',
]

export interface UserDoc {
  uid: string
  email: string | null
  displayName: string | null
  firstName: string
  lastName: string
  photoURL: string | null
  role: UserRole
  onboardingComplete: boolean
  /** Private. Never shown on the public profile. */
  birthday?: string
  createdAt: string
  updatedAt: string
}

export interface FootageLink {
  id: string
  url: string
  title: string
  format: MatchFormat
}

export interface RefereeProfileDoc {
  id: string
  ownerUid: string
  slug: string
  firstName: string
  lastName: string
  headshotUrl: string | null
  headshotThumbUrl: string | null
  bio: string
  society: string
  grade: string
  rating: number | null
  city: string
  region: string
  yearsOfficiating: number | null
  startedRefereeingYear: number | null
  joinedPopoloYear: number | null
  positions: RefereePosition[]
  highestCompetition: HighestCompetition | ''
  highestCompetitionOther?: string
  highestScope: CompetitionLevel | ''
  footageUrl?: string
  footage?: FootageLink[]
  instagram?: string
  /** Dated résumé rows. Title + start year + end year (or present). */
  heldPositions?: ResumeEntry[]
  certifications?: ResumeEntry[]
  accomplishments?: ResumeEntry[]
  societyRoles?: ResumeEntry[]
  /** @deprecated Hydrated into certifications when present. */
  certificationLevels?: string
  /** @deprecated Hydrated into accomplishments when present. */
  majorAccomplishments?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface GameDoc {
  id: string
  refereeId: string
  createdByUid: string
  date: string
  tournamentName: string
  format: MatchFormat
  /** @deprecated Prefer matchType + division. Kept for older logs. */
  level: CompetitionLevel
  gender?: MatchGender
  matchType?: MatchType
  division?: MatchDivision | null
  /** City and state as a single value, e.g. "Chicago, IL". */
  location?: string
  role: RefereePosition
  /** @deprecated Removed from the form. */
  fixture?: string
  evaluatorName?: string
  notes?: string
  footageUrl?: string
  evaluationId?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface DocumentDoc {
  id: string
  refereeId: string
  type: DocumentType
  title: string
  date: string
  storagePath: string
  downloadUrl: string
  uploadedByUid: string
  uploadedByRole: UserRole
  gameId?: string
  published: boolean
  createdAt: string
}

export interface MediaSubmissionDoc {
  id: string
  ownerUid: string
  ownerName: string
  imageUrl: string
  thumbUrl: string
  caption: string
  summary: string
  status: MediaStatus
  createdAt: string
  updatedAt: string
}

export interface ServiceRequestDoc {
  id: string
  organizerName: string
  organization: string
  email: string
  phone: string
  eventName: string
  startDate: string
  endDate: string
  location: string
  format: MatchFormat | 'both' | ''
  officialsNeeded: string
  notes: string
  status: RequestStatus
  honeypot?: string
  createdAt: string
  updatedAt: string
}

export interface ContactMessageDoc {
  id: string
  name: string
  email: string
  subject: string
  message: string
  honeypot?: string
  createdAt: string
}

export const SITE_PAGE_KEYS = [
  'home',
  'about',
  'cmoAlign',
  'calendar',
  'schedule',
  'people',
  'events',
  'referees',
  'stories',
  'request',
  'contact',
  'support',
  'privacy',
  'terms',
] as const

export type SitePageKey = (typeof SITE_PAGE_KEYS)[number]

export const DEFAULT_SITE_PAGES: Record<SitePageKey, boolean> = {
  home: true,
  about: true,
  cmoAlign: false,
  calendar: true,
  schedule: false,
  people: true,
  events: true,
  referees: true,
  stories: false,
  request: true,
  contact: true,
  support: true,
  privacy: true,
  terms: true,
}

export const SITE_PAGE_META: Record<
  SitePageKey,
  { label: string; hint: string; path: string; alwaysOn?: boolean }
> = {
  home: {
    label: 'Home',
    hint: 'Landing page — always on',
    path: '/',
    alwaysOn: true,
  },
  about: {
    label: 'About',
    hint: 'The program in the About menu',
    path: '/about',
  },
  cmoAlign: {
    label: 'CMO Align',
    hint: 'About submenu, footer, and /about/align',
    path: '/about/align',
  },
  calendar: {
    label: 'Calendar & minutes',
    hint: 'About submenu, footer, and /about/calendar',
    path: '/about/calendar',
  },
  schedule: {
    label: 'Schedule & timeline',
    hint: 'About submenu and /about/schedule',
    path: '/about/schedule',
  },
  people: {
    label: 'Advisors',
    hint: 'About submenu and /about/people',
    path: '/about/people',
  },
  events: {
    label: 'Events',
    hint: 'Top-level Events nav, listing, and event pages',
    path: '/events',
  },
  referees: {
    label: 'Referees',
    hint: 'Directory in the header and footer',
    path: '/referees',
  },
  stories: {
    label: 'Stories',
    hint: 'Stories nav, story pages, and the home-page story list',
    path: '/stories',
  },
  request: {
    label: 'Request',
    hint: 'Request Pōpolo form in the header and footer',
    path: '/request',
  },
  contact: {
    label: 'Contact',
    hint: 'Contact page in the header and footer',
    path: '/contact',
  },
  support: {
    label: 'Support',
    hint: 'Support page in the footer',
    path: '/support',
  },
  privacy: {
    label: 'Privacy',
    hint: 'Legal page — always on',
    path: '/privacy',
    alwaysOn: true,
  },
  terms: {
    label: 'Terms',
    hint: 'Legal page — always on',
    path: '/terms',
    alwaysOn: true,
  },
}

export function mergeSitePages(
  raw?: Partial<Record<SitePageKey, boolean>> | null,
): Record<SitePageKey, boolean> {
  const next = { ...DEFAULT_SITE_PAGES }
  if (!raw) return next
  for (const key of SITE_PAGE_KEYS) {
    if (typeof raw[key] === 'boolean') next[key] = raw[key]
    if (SITE_PAGE_META[key].alwaysOn) next[key] = true
  }
  return next
}

export function isSitePageEnabled(
  pages: Record<SitePageKey, boolean>,
  key: SitePageKey,
): boolean {
  if (SITE_PAGE_META[key].alwaysOn) return true
  return pages[key]
}

export function sitePageKeyForPath(path: string): SitePageKey | undefined {
  const clean = (path.split('?')[0] || '/').replace(/\/$/, '') || '/'
  const exact = SITE_PAGE_KEYS.find((key) => SITE_PAGE_META[key].path === clean)
  if (exact) return exact
  return [...SITE_PAGE_KEYS]
    .filter((key) => SITE_PAGE_META[key].path !== '/')
    .sort(
      (a, b) => SITE_PAGE_META[b].path.length - SITE_PAGE_META[a].path.length,
    )
    .find((key) => clean.startsWith(`${SITE_PAGE_META[key].path}/`))
}

export function aboutMenuHref(
  pages: Record<SitePageKey, boolean>,
): string {
  if (pages.about) return '/about'
  if (pages.calendar) return '/about/calendar'
  if (pages.people) return '/about/people'
  if (pages.schedule) return '/about/schedule'
  if (pages.cmoAlign) return '/about/align'
  return '/about'
}

export function showAboutMenu(pages: Record<SitePageKey, boolean>): boolean {
  return (
    pages.about ||
    pages.calendar ||
    pages.people ||
    pages.schedule ||
    pages.cmoAlign
  )
}

export interface MailingAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type EventCrewRole =
  | 'matchOfficial'
  | 'assistantReferee'
  | 'cmo'
  | 'techZoneManager'

export const EVENT_CREW_ROLES: EventCrewRole[] = [
  'matchOfficial',
  'assistantReferee',
  'cmo',
  'techZoneManager',
]

export const EVENT_CREW_ROLE_LABELS: Record<EventCrewRole, string> = {
  matchOfficial: 'Match official',
  assistantReferee: 'Assistant referee',
  cmo: 'CMO',
  techZoneManager: 'Tech Zone Manager',
}

export type EventApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'accepted'
  | 'waitlisted'
  | 'declined'

export const EVENT_APPLICATION_STATUSES: EventApplicationStatus[] = [
  'submitted',
  'reviewing',
  'accepted',
  'waitlisted',
  'declined',
]

export const EVENT_APPLICATION_STATUS_LABELS: Record<
  EventApplicationStatus,
  string
> = {
  submitted: 'Submitted',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  waitlisted: 'Waitlisted',
  declined: 'Declined',
}

export interface EventApplicationDoc {
  id: string
  eventSlug: string
  eventTitle: string
  eventFormat?: MatchFormat
  firstName: string
  lastName: string
  email: string
  phone: string
  mailingAddress: MailingAddress
  yearsOfficiating: number
  refereeGrade?: string
  divisionCodes: string[]
  positions: EventCrewRole[]
  refereeSociety: string
  recommendationContact?: string
  instagram?: string
  facebook?: string
  highestSevensCompetition: HighestCompetition
  highestSevensCompetitionOther?: string
  highestSevensScope: CompetitionLevel
  highestSevensNotes?: string
  matchFootageUrl?: string
  status: EventApplicationStatus
  submittedByUid?: string
  createdAt: string
  updatedAt: string
}

export function formatMailingAddress(address: MailingAddress): string {
  return [
    address.street,
    [address.city, address.state].filter(Boolean).join(', '),
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function loginPathFor(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`
}

export function eventApplyPath(slug: string): string {
  return `/events/${slug}/apply`
}

export function isEventCrewRole(value: string): value is EventCrewRole {
  return (EVENT_CREW_ROLES as string[]).includes(value)
}

export interface SitePhoto {
  src: string
  alt: string
  caption?: string
  credit?: string
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isCoach(role: UserRole): boolean {
  return role === 'coach'
}

export function isStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'coach'
}

export function isReferee(role: UserRole): boolean {
  return role === 'referee'
}

export function splitDisplayName(name: string | null | undefined): {
  firstName: string
  lastName: string
} {
  const trimmed = name?.trim() ?? ''
  if (!trimmed) return { firstName: '', lastName: '' }
  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

export function slugifyName(first: string, last: string): string {
  return `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function displayName(profile: {
  firstName: string
  lastName: string
}): string {
  return `${profile.firstName} ${profile.lastName}`.trim()
}

export const REFEREE_RATING_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export type RefereeRating = (typeof REFEREE_RATING_LEVELS)[number]

/** Grade / pathway label for each rating. 1 is highest. */
export const REFEREE_RATING_LABELS: Record<RefereeRating, string> = {
  1: 'International',
  2: 'HP+',
  3: 'MLR+',
  4: 'National+',
  5: 'NDG+',
  6: 'C1+',
  7: 'C1-',
  8: 'C2',
  9: 'C3',
  10: 'C4',
}

export function isRefereeRating(value: unknown): value is RefereeRating {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  )
}

/** 1 is the highest rating, 10 is the lowest. Rating and grade are the same scale. */
export function ratingLine(rating: number | null | undefined): string | null {
  if (!isRefereeRating(rating)) return null
  const grade = REFEREE_RATING_LABELS[rating]
  return grade ? `Level ${rating} · ${grade}` : `Level ${rating}`
}

export function gradeForRating(
  rating: number | null | undefined,
): string {
  if (!isRefereeRating(rating)) return ''
  return REFEREE_RATING_LABELS[rating]
}

export interface ResumeEntry {
  id: string
  title: string
  startYear: number | null
  /** Null means Present when a start year is set. */
  endYear: number | null
}

export function emptyResumeEntry(): ResumeEntry {
  return { id: newId(), title: '', startYear: null, endYear: null }
}

export function normalizeResumeEntries(raw: unknown): ResumeEntry[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') {
        return {
          id: newId(),
          title: item.trim(),
          startYear: null,
          endYear: null,
        }
      }
      if (!item || typeof item !== 'object') return emptyResumeEntry()
      const row = item as Partial<ResumeEntry>
      const startYear =
        typeof row.startYear === 'number' ? row.startYear : null
      const endYear =
        typeof row.endYear === 'number' ? row.endYear : null
      return {
        id: typeof row.id === 'string' && row.id ? row.id : newId(),
        title: String(row.title ?? '').trim(),
        startYear,
        endYear,
      }
    })
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [
      { id: newId(), title: raw.trim(), startYear: null, endYear: null },
    ]
  }
  return []
}

export function compactResumeEntries(entries: ResumeEntry[]): ResumeEntry[] {
  return entries
    .map((entry) => ({
      ...entry,
      title: entry.title.trim(),
    }))
    .filter((entry) => entry.title)
}

export function resumeEntriesForForm(raw: unknown): ResumeEntry[] {
  const compact = compactResumeEntries(normalizeResumeEntries(raw))
  return compact.length ? compact : [emptyResumeEntry()]
}

export function resumeYearRange(entry: ResumeEntry): string {
  if (entry.startYear && entry.endYear && entry.endYear !== entry.startYear) {
    return `${entry.startYear}–${entry.endYear}`
  }
  if (entry.startYear) return String(entry.startYear)
  if (entry.endYear) return String(entry.endYear)
  return ''
}

export function formatResumeEntry(entry: ResumeEntry): string {
  const range = resumeYearRange(entry)
  return range ? `${entry.title} (${range})` : entry.title
}

export function publishedRefereeDirectory(
  profiles: RefereeProfileDoc[],
): RefereeProfileDoc[] {
  return [...profiles]
    .filter((profile) => profile.published)
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    )
}

export function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function evaluationForGame(
  game: GameDoc,
  documents: DocumentDoc[],
): DocumentDoc | undefined {
  return documents.find(
    (doc) => doc.gameId === game.id || doc.id === game.evaluationId,
  )
}

export function formatsInLog(games: GameDoc[]): MatchFormat[] {
  const seen = new Set(games.map((game) => game.format))
  return MATCH_FORMATS.filter((format) => seen.has(format))
}

export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_REFEREEING_YEAR = 1970
export const MIN_POPOLO_YEAR = 2018

/** Digits-only, max 4 characters, for typed year fields. */
export function sanitizeYearInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4)
}

/** Four-digit year within [minYear, maxYear], otherwise null. Empty is null. */
export function parseTypedYear(
  raw: string,
  minYear: number,
  maxYear = CURRENT_YEAR,
): number | null {
  const digits = sanitizeYearInput(raw)
  if (digits.length !== 4) return null
  const year = Number(digits)
  if (year < minYear || year > maxYear) return null
  return year
}

export function yearsSince(
  year: number | null | undefined,
  now = CURRENT_YEAR,
): number | null {
  if (!year) return null
  return Math.max(0, now - year)
}

/** YYYY-MM-DD. Officials must be 18+. */
export function isAtLeast18(isoDate: string, now = new Date()): boolean {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return false
  const eighteenth = new Date(year + 18, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return today >= eighteenth
}

export function resumeHasPublicCopy(profile: RefereeProfileDoc): boolean {
  return Boolean(
    compactResumeEntries(normalizeResumeEntries(profile.heldPositions)).length ||
      compactResumeEntries(
        normalizeResumeEntries(
          profile.certifications ?? profile.certificationLevels,
        ),
      ).length ||
      compactResumeEntries(normalizeResumeEntries(profile.societyRoles)).length,
  )
}

export function createEmptyRefereeProfile(
  uid: string,
  first: string,
  last: string,
): RefereeProfileDoc {
  const now = new Date().toISOString()
  return {
    id: uid,
    ownerUid: uid,
    slug: slugifyName(first, last) || uid,
    firstName: first,
    lastName: last,
    headshotUrl: null,
    headshotThumbUrl: null,
    bio: '',
    society: '',
    grade: '',
    rating: null,
    city: '',
    region: '',
    yearsOfficiating: null,
    startedRefereeingYear: null,
    joinedPopoloYear: null,
    positions: [],
    highestCompetition: '',
    highestScope: '',
    footage: [],
    heldPositions: [],
    certifications: [],
    accomplishments: [],
    societyRoles: [],
    published: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'coach':
      return '/portal'
    case 'referee':
      return '/portal'
    default:
      return '/'
  }
}

export function safeNextPath(
  next: string | null | undefined,
  role: UserRole,
): string {
  const fallback = homePathForRole(role)
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback
  }
  if (next === '/admin' || next.startsWith('/admin/')) {
    return isAdmin(role) ? next : fallback
  }
  return next
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
