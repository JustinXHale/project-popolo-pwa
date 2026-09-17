import {
  parseEventMatchFormat,
  type MatchFormat,
} from '../../types/models'

export interface ContentPage {
  path: string
  title: string
  description?: string
  nav?: string
  order: number
  modules: string[]
  heroImage?: string
  heroHeading?: string
  heroCtaLabel?: string
  heroCtaTo?: string
  photos: string[]
  peopleSource?: string
  peopleHeading?: string
  ctaHeading?: string
  ctaLabel?: string
  ctaTo?: string
  calendarUrl?: string
  minutesUrl?: string
  calendarTz?: string
  body: string
}

export interface ContentPerson {
  slug: string
  name: string
  role: string
  group: 'leadership' | 'advisory-domestic' | 'advisory-international'
  photo: string
  location?: string
  body: string
}

export interface ContentStory {
  slug: string
  title: string
  date: string
  category: string
  cover: string
  photos: string[]
  body: string
}

export interface ContentEvent {
  slug: string
  title: string
  summary: string
  location: string
  venue?: string
  startDate: string
  endDate: string
  datesLabel?: string
  format: string
  matchFormat: MatchFormat
  cover: string
  photos: string[]
  applicationsOpen: boolean
  applicationDeadline?: string
  divisions: string[]
  body: string
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function list(value: string | undefined, sep = ','): string[] {
  if (!value) return []
  return value
    .split(sep)
    .map((part) => part.trim())
    .filter(Boolean)
}

function flag(value: string | undefined, fallback = false): boolean {
  if (value == null || value === '') return fallback
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function slugFromPath(filePath: string): string {
  const base = filePath.split('/').pop() ?? ''
  return base.replace(/\.md$/, '')
}

export function pageFromMarkdown(
  filePath: string,
  data: Record<string, string>,
  body: string,
): ContentPage {
  return {
    path: data.path || `/${slugFromPath(filePath)}`,
    title: data.title || slugFromPath(filePath),
    description: data.description,
    nav: data.nav,
    order: num(data.order, 100),
    modules: list(data.modules),
    heroImage: data.heroImage,
    heroHeading: data.heroHeading,
    heroCtaLabel: data.heroCtaLabel,
    heroCtaTo: data.heroCtaTo,
    photos: list(data.photos, '|'),
    peopleSource: data.peopleSource,
    peopleHeading: data.peopleHeading,
    ctaHeading: data.ctaHeading,
    ctaLabel: data.ctaLabel,
    ctaTo: data.ctaTo,
    calendarUrl: data.calendarUrl || undefined,
    minutesUrl: data.minutesUrl || undefined,
    calendarTz: data.calendarTz || undefined,
    body,
  }
}

export function personFromMarkdown(
  filePath: string,
  data: Record<string, string>,
  body: string,
): ContentPerson {
  const group = data.group as ContentPerson['group']
  return {
    slug: data.slug || slugFromPath(filePath),
    name: data.name || slugFromPath(filePath),
    role: data.role || '',
    group:
      group === 'advisory-domestic' || group === 'advisory-international'
        ? group
        : 'leadership',
    photo: data.photo || '',
    location: data.location,
    body,
  }
}

export function storyFromMarkdown(
  filePath: string,
  data: Record<string, string>,
  body: string,
): ContentStory {
  return {
    slug: data.slug || slugFromPath(filePath),
    title: data.title || slugFromPath(filePath),
    date: data.date || '',
    category: data.category || 'news',
    cover: data.cover || '',
    photos: list(data.photos, '|'),
    body,
  }
}

export function eventFromMarkdown(
  filePath: string,
  data: Record<string, string>,
  body: string,
): ContentEvent {
  return {
    slug: data.slug || slugFromPath(filePath),
    title: data.title || slugFromPath(filePath),
    summary: data.summary || '',
    location: data.location || '',
    venue: data.venue || undefined,
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    datesLabel: data.datesLabel || undefined,
    format: data.format || '',
    matchFormat: parseEventMatchFormat(data.format),
    cover: data.cover || '',
    photos: list(data.photos, '|'),
    applicationsOpen: flag(data.applicationsOpen, true),
    applicationDeadline: data.applicationDeadline || undefined,
    divisions: list(data.divisions, '|'),
    body,
  }
}
