import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../../components/ui/Field'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import {
  isCoreApplicationQuestion,
  resolveEventApplicationForm,
} from '../../lib/eventApplicationForms'
import {
  formatEventDeadline,
  formatEventWhen,
  CONTENT_EVENTS,
} from '../content/loadContent'
import type { ContentEvent } from '../content/types'
import {
  COMPETITION_LEVELS,
  COMPETITION_LEVEL_LABELS,
  EVENT_APPLICATION_STATUS_LABELS,
  EVENT_CREW_ROLES,
  EVENT_CREW_ROLE_LABELS,
  HIGHEST_COMPETITIONS,
  MATCH_FORMAT_LABELS,
  eventApplyPath,
  eventExperienceNoun,
  highestCompetitionLabelsForFormat,
  isEventCrewRole,
  newId,
  normalizeHttpUrl,
  type CompetitionLevel,
  type EventCrewRole,
  type EventApplicationQuestion,
  type HighestCompetition,
  type RefereePosition,
} from '../../types/models'
import './events.css'

function CustomApplicationQuestion({
  question,
}: {
  question: EventApplicationQuestion
}) {
  const name = `answer_${question.id}`
  if (question.type === 'checkboxes') {
    return (
      <fieldset className="apply-fieldset">
        <legend>{question.label}</legend>
        {question.hint ? (
          <p className="apply-fieldset__hint">{question.hint}</p>
        ) : null}
        <div className="apply-checks">
          {(question.options ?? []).map((option) => (
            <label key={option} className="apply-check">
              <input type="checkbox" name={name} value={option} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (question.type === 'select') {
    return (
      <Field label={question.label} htmlFor={name} hint={question.hint}>
        <TextSelect id={name} name={name} required={question.required}>
          <option value="">Select an option</option>
          {(question.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </TextSelect>
      </Field>
    )
  }

  if (question.type === 'longText') {
    return (
      <Field label={question.label} htmlFor={name} hint={question.hint}>
        <TextTextarea id={name} name={name} required={question.required} />
      </Field>
    )
  }

  return (
    <Field label={question.label} htmlFor={name} hint={question.hint}>
      <TextInput
        id={name}
        name={name}
        required={question.required}
        type={
          question.type === 'number'
            ? 'number'
            : question.type === 'url'
              ? 'url'
              : 'text'
        }
      />
    </Field>
  )
}

function TournamentSelect({
  event,
  openEvents,
  onChange,
}: {
  event: ContentEvent
  openEvents: ContentEvent[]
  onChange: (slug: string) => void
}) {
  return (
    <Field
      label="Tournament"
      htmlFor="eventSlug"
      hint="Pre-filled from the event you opened. Switching updates divisions and the 7s / 15s questions."
    >
      <TextSelect
        id="eventSlug"
        name="eventSlug"
        required
        value={event.slug}
        onChange={(e) => {
          const slug = e.target.value
          if (slug && slug !== event.slug) onChange(slug)
        }}
      >
        {openEvents.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.title}
            {item.matchFormat
              ? ` (${MATCH_FORMAT_LABELS[item.matchFormat]})`
              : ''}
          </option>
        ))}
      </TextSelect>
    </Field>
  )
}

function crewRolesFromProfile(positions: RefereePosition[]): EventCrewRole[] {
  const roles = new Set<EventCrewRole>()
  for (const position of positions) {
    if (position === 'center') roles.add('matchOfficial')
    if (position === 'ar') roles.add('assistantReferee')
  }
  return [...roles]
}

export function EventApplyForm({ event }: { event: ContentEvent }) {
  const {
    eventApplications,
    eventApplicationForms,
    profiles,
    submitEventApplication,
  } = useData()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const referee = profiles.find((item) => item.ownerUid === user?.uid)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [competition, setCompetition] = useState<HighestCompetition>(
    referee?.highestCompetition || 'localClub',
  )
  const deadline = formatEventDeadline(event.applicationDeadline)
  const defaultEmail = profile?.email ?? user?.email ?? ''
  const defaultRoles = crewRolesFromProfile(referee?.positions ?? [])
  const existing = eventApplications.find(
    (app) =>
      app.eventSlug === event.slug &&
      app.submittedByUid === user?.uid &&
      app.status !== 'declined',
  )
  const openEvents = CONTENT_EVENTS.filter((item) => item.applicationsOpen)
  const formDefinition = resolveEventApplicationForm(
    event,
    eventApplicationForms.find((form) => form.eventSlug === event.slug),
  )
  const questions = new Map(
    formDefinition.questions.map((question) => [question.id, question]),
  )
  const question = (id: string) => {
    const item = questions.get(id)
    if (!item) throw new Error(`Missing application question: ${id}`)
    return item
  }
  const customQuestions = formDefinition.questions.filter(
    (item) => !isCoreApplicationQuestion(item.id),
  )

  if (existing) {
    return (
      <div className="apply-form">
        <h1>Application received</h1>
        <p role="status">
          You already applied for {event.title}. Status:{' '}
          <strong>{EVENT_APPLICATION_STATUS_LABELS[existing.status]}</strong>.
          We&apos;ll follow up by email if anything changes.
        </p>
        {openEvents.length > 1 ? (
          <TournamentSelect
            event={event}
            openEvents={openEvents}
            onChange={(slug) => navigate(eventApplyPath(slug))}
          />
        ) : null}
        <p>
          <Link to={`/events/${event.slug}`}>Back to event</Link>
        </p>
      </div>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    try {
      if (!user?.uid) throw new Error('Sign in required to apply.')
      const honeypot = String(fd.get('website_url') ?? '')
      if (honeypot) return

      const positions = EVENT_CREW_ROLES.filter(
        (role) => fd.get(`position_${role}`) === 'on',
      )
      const divisionCodes = event.divisions.filter(
        (division) => fd.get(`division_${division}`) === 'on',
      )

      if (question('positions').required && positions.length === 0) {
        throw new Error('Select at least one role.')
      }
      if (
        question('divisionCodes').required &&
        event.divisions.length > 0 &&
        divisionCodes.length === 0
      ) {
        throw new Error('Select at least one division.')
      }

      const yearsRaw = Number(fd.get('yearsOfficiating'))
      if (!Number.isFinite(yearsRaw) || yearsRaw < 0 || yearsRaw > 80) {
        throw new Error('Enter a valid number of years officiating.')
      }

      const highestSevensCompetition = String(
        fd.get('highestSevensCompetition'),
      ) as HighestCompetition
      const otherDetail = String(fd.get('highestSevensCompetitionOther') || '')
      const footageRaw = String(fd.get('matchFootageUrl') || '').trim()
      const answers: Record<string, string | number | string[]> = {}
      for (const item of customQuestions) {
        const fieldName = `answer_${item.id}`
        const value =
          item.type === 'checkboxes'
            ? fd.getAll(fieldName).map(String)
            : String(fd.get(fieldName) ?? '').trim()
        const empty = Array.isArray(value) ? value.length === 0 : value === ''
        if (item.required && empty) {
          throw new Error(`Answer “${item.label}” before submitting.`)
        }
        if (!empty) {
          if (item.type === 'number') {
            const number = Number(value)
            if (!Number.isFinite(number)) {
              throw new Error(`Enter a valid number for “${item.label}”.`)
            }
            answers[item.id] = number
          } else {
            answers[item.id] = value
          }
        }
      }

      await submitEventApplication({
        id: newId(),
        eventSlug: event.slug,
        eventTitle: event.title,
        eventFormat: event.matchFormat,
        firstName: String(fd.get('firstName')).trim(),
        lastName: String(fd.get('lastName')).trim(),
        email: String(fd.get('email')).trim(),
        phone: String(fd.get('phone')).trim(),
        mailingAddress: {
          street: String(fd.get('street')).trim(),
          city: String(fd.get('city')).trim(),
          state: String(fd.get('state')).trim(),
          postalCode: String(fd.get('postalCode')).trim(),
          country: String(fd.get('country') || 'United States').trim(),
        },
        yearsOfficiating: yearsRaw,
        refereeGrade: String(fd.get('refereeGrade') || '').trim() || undefined,
        divisionCodes,
        positions: positions.filter(isEventCrewRole),
        refereeSociety: String(fd.get('refereeSociety')).trim(),
        recommendationContact:
          String(fd.get('recommendationContact') || '').trim() || undefined,
        instagram: String(fd.get('instagram') || '').trim() || undefined,
        facebook: String(fd.get('facebook') || '').trim() || undefined,
        highestSevensCompetition,
        highestSevensCompetitionOther: otherDetail.trim() || undefined,
        highestSevensScope: String(
          fd.get('highestSevensScope'),
        ) as CompetitionLevel,
        highestSevensNotes:
          String(fd.get('highestSevensNotes') || '').trim() || undefined,
        matchFootageUrl: footageRaw ? normalizeHttpUrl(footageRaw) : undefined,
        answers: Object.keys(answers).length ? answers : undefined,
        questionSnapshot: customQuestions.map((item) => ({
          id: item.id,
          label: item.label,
          type: item.type,
        })),
        status: 'submitted',
        submittedByUid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      navigate(`${eventApplyPath(event.slug)}/submitted`, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit application. Try again.',
      )
    } finally {
      setPending(false)
    }
  }

  const footageDefault =
    referee?.footageUrl || referee?.footage?.[0]?.url || ''
  const formatNoun = eventExperienceNoun(event.matchFormat)
  const competitionLabels = highestCompetitionLabelsForFormat(event.matchFormat)

  return (
    <div className="apply-form">
      <h1>Referee application</h1>
      <p>
        Apply to officiate {event.title}
        {event.location ? ` in ${event.location}` : ''}.{' '}
        {formatEventWhen(event)}.
        {deadline ? ` Deadline: ${deadline}.` : ' Rolling review.'} Pōpolo
        will follow up by email.
      </p>

      {error ? (
        <p role="alert" className="apply-form__error">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className="hp" aria-hidden="true">
          <label htmlFor="website_url">Website</label>
          <input
            id="website_url"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <TournamentSelect
          event={event}
          openEvents={openEvents}
          onChange={(slug) => navigate(eventApplyPath(slug))}
        />

        <div className="apply-form__row">
          <Field
            label={question('firstName').label}
            htmlFor="firstName"
            hint={question('firstName').hint}
          >
            <TextInput
              id="firstName"
              name="firstName"
              required={question('firstName').required}
              maxLength={80}
              defaultValue={profile?.firstName ?? referee?.firstName ?? ''}
            />
          </Field>
          <Field
            label={question('lastName').label}
            htmlFor="lastName"
            hint={question('lastName').hint}
          >
            <TextInput
              id="lastName"
              name="lastName"
              required={question('lastName').required}
              maxLength={80}
              defaultValue={profile?.lastName ?? referee?.lastName ?? ''}
            />
          </Field>
        </div>

        <div className="apply-form__row">
          <Field
            label={question('email').label}
            htmlFor="email"
            hint={question('email').hint}
          >
            <TextInput
              id="email"
              name="email"
              type="email"
              required={question('email').required}
              defaultValue={defaultEmail}
            />
          </Field>
          <Field
            label={question('phone').label}
            htmlFor="phone"
            hint={question('phone').hint}
          >
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              required={question('phone').required}
            />
          </Field>
        </div>

        <div className="apply-form__row">
          <Field
            label={question('instagram').label}
            htmlFor="instagram"
            hint={question('instagram').hint}
          >
            <TextInput
              id="instagram"
              name="instagram"
              placeholder="@yourhandle"
              defaultValue={referee?.instagram ?? ''}
              required={question('instagram').required}
            />
          </Field>
          <Field
            label={question('facebook').label}
            htmlFor="facebook"
            hint={question('facebook').hint}
          >
            <TextInput
              id="facebook"
              name="facebook"
              required={question('facebook').required}
            />
          </Field>
        </div>

        <fieldset className="apply-fieldset">
          <legend>{question('mailingAddress').label}</legend>
          <Field label="Street" htmlFor="street">
            <TextInput
              id="street"
              name="street"
              required={question('mailingAddress').required}
              autoComplete="street-address"
            />
          </Field>
          <div className="apply-form__row">
            <Field label="City" htmlFor="city">
              <TextInput
                id="city"
                name="city"
                required={question('mailingAddress').required}
                autoComplete="address-level2"
                defaultValue={referee?.city ?? ''}
              />
            </Field>
            <Field label="State" htmlFor="state">
              <TextInput
                id="state"
                name="state"
                required={question('mailingAddress').required}
                autoComplete="address-level1"
                defaultValue={referee?.region ?? ''}
              />
            </Field>
          </div>
          <div className="apply-form__row">
            <Field label="Postal code" htmlFor="postalCode">
              <TextInput
                id="postalCode"
                name="postalCode"
                required={question('mailingAddress').required}
                autoComplete="postal-code"
              />
            </Field>
            <Field label="Country" htmlFor="country">
              <TextInput
                id="country"
                name="country"
                required={question('mailingAddress').required}
                defaultValue="United States"
                autoComplete="country-name"
              />
            </Field>
          </div>
        </fieldset>

        <div className="apply-form__row">
          <Field
            label={question('yearsOfficiating').label}
            htmlFor="yearsOfficiating"
          >
            <TextInput
              id="yearsOfficiating"
              name="yearsOfficiating"
              type="number"
              min={0}
              max={80}
              step={1}
              required={question('yearsOfficiating').required}
              defaultValue={
                referee?.yearsOfficiating != null
                  ? String(referee.yearsOfficiating)
                  : ''
              }
            />
          </Field>
          <Field
            label={question('refereeGrade').label}
            htmlFor="refereeGrade"
            hint={question('refereeGrade').hint}
          >
            <TextInput
              id="refereeGrade"
              name="refereeGrade"
              defaultValue={referee?.grade ?? ''}
              required={question('refereeGrade').required}
            />
          </Field>
        </div>

        <div className="apply-form__row apply-form__row--align-start">
          {event.divisions.length ? (
            <fieldset className="apply-fieldset">
              <legend>{question('divisionCodes').label}</legend>
              <p className="apply-fieldset__hint">
                {question('divisionCodes').hint ||
                  `These brackets are for ${event.title}.`}
              </p>
              <div className="apply-checks">
                {event.divisions.map((division) => (
                  <label key={division} className="apply-check">
                    <input type="checkbox" name={`division_${division}`} />
                    {division}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <fieldset className="apply-fieldset">
            <legend>{question('positions').label}</legend>
            {question('positions').hint ? (
              <p className="apply-fieldset__hint">
                {question('positions').hint}
              </p>
            ) : null}
            <div className="apply-checks">
              {EVENT_CREW_ROLES.map((role) => (
                <label key={role} className="apply-check">
                  <input
                    type="checkbox"
                    name={`position_${role}`}
                    defaultChecked={defaultRoles.includes(role)}
                  />
                  {EVENT_CREW_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="apply-form__row">
          <Field
            label={question('refereeSociety').label}
            htmlFor="refereeSociety"
            hint={question('refereeSociety').hint}
          >
            <TextInput
              id="refereeSociety"
              name="refereeSociety"
              required={question('refereeSociety').required}
              defaultValue={referee?.society ?? ''}
            />
          </Field>
          <Field
            label={question('recommendationContact').label}
            htmlFor="recommendationContact"
            hint={question('recommendationContact').hint}
          >
            <TextInput
              id="recommendationContact"
              name="recommendationContact"
              required={question('recommendationContact').required}
            />
          </Field>
        </div>

        <fieldset className="apply-fieldset">
          <legend>Highest level of {formatNoun} officiated</legend>
          <p className="apply-fieldset__hint">
            This event is {MATCH_FORMAT_LABELS[event.matchFormat]}. Tell us the
            highest {formatNoun} competition you have worked, and whether that
            was local only or a higher tier.
          </p>
          <Field
            label={question('highestSevensCompetition').label}
            htmlFor="highestSevensCompetition"
            hint={question('highestSevensCompetition').hint}
          >
            <TextSelect
              id="highestSevensCompetition"
              name="highestSevensCompetition"
              required={question('highestSevensCompetition').required}
              value={competition}
              onChange={(e) =>
                setCompetition(e.target.value as HighestCompetition)
              }
            >
              {HIGHEST_COMPETITIONS.map((level) => (
                <option key={level} value={level}>
                  {competitionLabels[level]}
                </option>
              ))}
            </TextSelect>
          </Field>
          {competition === 'other' ? (
            <Field
              label="Describe the competition"
              htmlFor="highestSevensCompetitionOther"
            >
              <TextInput
                id="highestSevensCompetitionOther"
                name="highestSevensCompetitionOther"
                required
                defaultValue={referee?.highestCompetitionOther ?? ''}
              />
            </Field>
          ) : (
            <input type="hidden" name="highestSevensCompetitionOther" value="" />
          )}
          <Field
            label={question('highestSevensScope').label}
            htmlFor="highestSevensScope"
            hint={question('highestSevensScope').hint}
          >
            <TextSelect
              id="highestSevensScope"
              name="highestSevensScope"
              required={question('highestSevensScope').required}
              defaultValue={referee?.highestScope || 'local'}
            >
              {COMPETITION_LEVELS.map((scope) => (
                <option key={scope} value={scope}>
                  {COMPETITION_LEVEL_LABELS[scope]}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field
            label={question('highestSevensNotes').label}
            htmlFor="highestSevensNotes"
            hint={question('highestSevensNotes').hint}
          >
            <TextTextarea
              id="highestSevensNotes"
              name="highestSevensNotes"
              required={question('highestSevensNotes').required}
            />
          </Field>
        </fieldset>

        <Field
          label={question('matchFootageUrl').label}
          htmlFor="matchFootageUrl"
          hint={question('matchFootageUrl').hint}
        >
          <TextInput
            id="matchFootageUrl"
            name="matchFootageUrl"
            type="url"
            placeholder="https://"
            defaultValue={footageDefault}
            required={question('matchFootageUrl').required}
          />
        </Field>
        {customQuestions.length ? (
          <fieldset className="apply-fieldset">
            <legend>Additional questions</legend>
            {customQuestions.map((item) => (
              <CustomApplicationQuestion key={item.id} question={item} />
            ))}
          </fieldset>
        ) : null}
        <p className="apply-form__fine">
          By submitting you acknowledge the event{' '}
          <Link to="/terms">terms</Link> and{' '}
          <Link to="/privacy">privacy</Link> policy.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit referee application'}
        </Button>
      </form>
    </div>
  )
}
