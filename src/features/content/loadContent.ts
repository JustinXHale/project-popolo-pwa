import { parseFrontmatter } from '../../lib/markdown'
import {
  eventFromMarkdown,
  pageFromMarkdown,
  personFromMarkdown,
  storyFromMarkdown,
  type ContentEvent,
  type ContentPage,
  type ContentPerson,
  type ContentStory,
} from './types'

const pageFiles = import.meta.glob('../../../content/pages/*.md', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const peopleFiles = import.meta.glob('../../../content/people/*.md', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const storyFiles = import.meta.glob('../../../content/stories/*.md', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

const eventFiles = import.meta.glob('../../../content/events/*.md', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>

function load<T>(
  files: Record<string, string>,
  map: (path: string, data: Record<string, string>, body: string) => T,
): T[] {
  return Object.entries(files).map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw)
    return map(path, data, body)
  })
}

export const CONTENT_PAGES: ContentPage[] = load(
  pageFiles,
  pageFromMarkdown,
).sort((a, b) => a.order - b.order || a.path.localeCompare(b.path))

export const CONTENT_PEOPLE: ContentPerson[] = load(
  peopleFiles,
  personFromMarkdown,
)

export const CONTENT_STORIES: ContentStory[] = load(
  storyFiles,
  storyFromMarkdown,
).sort((a, b) => b.date.localeCompare(a.date))

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function eventSortKey(event: ContentEvent): string {
  const today = todayIso()
  const end = event.endDate || event.startDate
  if (end && end < today) return `2-${end}-${event.title}`
  const start = event.startDate || '0000-00-00'
  return `1-${start}-${event.title}`
}

export const CONTENT_EVENTS: ContentEvent[] = load(
  eventFiles,
  eventFromMarkdown,
).sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))

export function pageByPath(path: string): ContentPage | undefined {
  return CONTENT_PAGES.find((page) => page.path === path)
}

export function storyBySlug(slug: string): ContentStory | undefined {
  return CONTENT_STORIES.find((story) => story.slug === slug)
}

export function eventBySlug(slug: string): ContentEvent | undefined {
  return CONTENT_EVENTS.find((event) => event.slug === slug)
}

export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatEventWhen(event: ContentEvent): string {
  if (event.datesLabel) return event.datesLabel
  if (event.startDate && event.endDate && event.startDate !== event.endDate) {
    return `${formatIsoDate(event.startDate)} – ${formatIsoDate(event.endDate)}`
  }
  if (event.startDate) return formatIsoDate(event.startDate)
  return 'Dates to be announced'
}

export function formatEventDeadline(iso?: string): string | undefined {
  if (!iso) return undefined
  return formatIsoDate(iso)
}

export function peopleInGroup(
  group: ContentPerson['group'],
): ContentPerson[] {
  return CONTENT_PEOPLE.filter((person) => person.group === group)
}
