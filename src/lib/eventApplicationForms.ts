import type { ContentEvent } from '../features/content/types'
import {
  EVENT_CREW_ROLE_LABELS,
  EVENT_CREW_ROLES,
  HIGHEST_COMPETITIONS,
  highestCompetitionLabelsForFormat,
  type EventApplicationFormDoc,
  type EventApplicationQuestion,
} from '../types/models'

const CORE_QUESTION_IDS = new Set([
  'firstName',
  'lastName',
  'email',
  'phone',
  'instagram',
  'facebook',
  'mailingAddress',
  'yearsOfficiating',
  'refereeGrade',
  'divisionCodes',
  'positions',
  'refereeSociety',
  'recommendationContact',
  'highestSevensCompetition',
  'highestSevensScope',
  'highestSevensNotes',
  'matchFootageUrl',
])

export function isCoreApplicationQuestion(id: string): boolean {
  return CORE_QUESTION_IDS.has(id)
}

export function defaultEventApplicationQuestions(
  event: ContentEvent,
): EventApplicationQuestion[] {
  const formatNoun =
    event.matchFormat === 'fifteens'
      ? 'fifteens'
      : event.matchFormat === 'tens'
        ? 'tens'
        : event.matchFormat === 'rugbyLeague'
          ? 'rugby league'
          : event.matchFormat === 'touch'
            ? 'touch'
            : 'sevens'
  const competitionLabels = highestCompetitionLabelsForFormat(
    event.matchFormat,
  )

  return [
    { id: 'firstName', label: 'First name', type: 'shortText', required: true },
    { id: 'lastName', label: 'Last name', type: 'shortText', required: true },
    {
      id: 'email',
      label: 'Email address',
      type: 'shortText',
      required: true,
    },
    {
      id: 'phone',
      label: 'Phone number',
      type: 'shortText',
      required: true,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      hint: 'Optional · handle or URL',
      type: 'shortText',
      required: false,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      hint: 'Optional · page or URL',
      type: 'shortText',
      required: false,
    },
    {
      id: 'mailingAddress',
      label: 'Mailing address',
      type: 'address',
      required: true,
    },
    {
      id: 'yearsOfficiating',
      label: 'Years of officiating experience',
      type: 'number',
      required: true,
    },
    {
      id: 'refereeGrade',
      label: 'Referee grade',
      hint: 'If known — optional',
      type: 'shortText',
      required: false,
    },
    {
      id: 'divisionCodes',
      label: 'Divisions interested in',
      hint: `These brackets are for ${event.title}.`,
      type: 'checkboxes',
      required: event.divisions.length > 0,
      options: event.divisions,
    },
    {
      id: 'positions',
      label: 'Role(s)',
      type: 'checkboxes',
      required: true,
      options: EVENT_CREW_ROLES.map((role) => EVENT_CREW_ROLE_LABELS[role]),
    },
    {
      id: 'refereeSociety',
      label: 'Referee society',
      type: 'shortText',
      required: true,
    },
    {
      id: 'recommendationContact',
      label: 'Recommendation contact',
      hint: 'Optional — name and phone or email',
      type: 'shortText',
      required: false,
    },
    {
      id: 'highestSevensCompetition',
      label: `Highest ${formatNoun} competition`,
      type: 'select',
      required: true,
      options: HIGHEST_COMPETITIONS.map((level) => competitionLabels[level]),
    },
    {
      id: 'highestSevensScope',
      label: 'At what level / scope',
      hint: 'Local, regional, national, or international',
      type: 'select',
      required: true,
      options: ['Local', 'Regional', 'National', 'International'],
    },
    {
      id: 'highestSevensNotes',
      label: `More detail on ${formatNoun} experience`,
      hint: 'Optional — events, years, or notable appointments',
      type: 'longText',
      required: false,
    },
    {
      id: 'matchFootageUrl',
      label: 'Match footage link',
      hint: `Optional — preferably ${formatNoun} (YouTube, Hudl, Google Drive, etc.)`,
      type: 'url',
      required: false,
    },
  ]
}

export function resolveEventApplicationForm(
  event: ContentEvent,
  saved?: EventApplicationFormDoc,
): EventApplicationFormDoc {
  const defaults = defaultEventApplicationQuestions(event)
  if (!saved) {
    return { eventSlug: event.slug, questions: defaults, updatedAt: '' }
  }

  const savedById = new Map(saved.questions.map((question) => [question.id, question]))
  const core = defaults.map((question) => ({
    ...question,
    ...savedById.get(question.id),
    id: question.id,
    type: question.type,
    options: question.options,
  }))
  const custom = saved.questions.filter(
    (question) => !isCoreApplicationQuestion(question.id),
  )
  return { ...saved, questions: [...core, ...custom] }
}
