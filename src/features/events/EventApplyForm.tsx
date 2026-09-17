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
  type HighestCompetition,
  type RefereePosition,
} from '../../types/models'
import './events.css'

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
  const { eventApplications, profiles, submitEventApplication } = useData()
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

      if (positions.length === 0) {
        throw new Error('Select at least one role.')
      }
      if (event.divisions.length > 0 && divisionCodes.length === 0) {
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
          <Field label="First name" htmlFor="firstName">
            <TextInput
              id="firstName"
              name="firstName"
              required
              maxLength={80}
              defaultValue={profile?.firstName ?? referee?.firstName ?? ''}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <TextInput
              id="lastName"
              name="lastName"
              required
              maxLength={80}
              defaultValue={profile?.lastName ?? referee?.lastName ?? ''}
            />
          </Field>
        </div>

        <div className="apply-form__row">
          <Field label="Email address" htmlFor="email">
            <TextInput
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
            />
          </Field>
          <Field label="Phone number" htmlFor="phone">
            <TextInput id="phone" name="phone" type="tel" required />
          </Field>
        </div>

        <div className="apply-form__row">
          <Field
            label="Instagram"
            htmlFor="instagram"
            hint="Optional · handle or URL"
          >
            <TextInput
              id="instagram"
              name="instagram"
              placeholder="@yourhandle"
              defaultValue={referee?.instagram ?? ''}
            />
          </Field>
          <Field
            label="Facebook"
            htmlFor="facebook"
            hint="Optional · page or URL"
          >
            <TextInput id="facebook" name="facebook" />
          </Field>
        </div>

        <fieldset className="apply-fieldset">
          <legend>Mailing address</legend>
          <Field label="Street" htmlFor="street">
            <TextInput
              id="street"
              name="street"
              required
              autoComplete="street-address"
            />
          </Field>
          <div className="apply-form__row">
            <Field label="City" htmlFor="city">
              <TextInput
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={referee?.city ?? ''}
              />
            </Field>
            <Field label="State" htmlFor="state">
              <TextInput
                id="state"
                name="state"
                required
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
                required
                autoComplete="postal-code"
              />
            </Field>
            <Field label="Country" htmlFor="country">
              <TextInput
                id="country"
                name="country"
                required
                defaultValue="United States"
                autoComplete="country-name"
              />
            </Field>
          </div>
        </fieldset>

        <div className="apply-form__row">
          <Field
            label="Years of officiating experience"
            htmlFor="yearsOfficiating"
          >
            <TextInput
              id="yearsOfficiating"
              name="yearsOfficiating"
              type="number"
              min={0}
              max={80}
              step={1}
              required
              defaultValue={
                referee?.yearsOfficiating != null
                  ? String(referee.yearsOfficiating)
                  : ''
              }
            />
          </Field>
          <Field
            label="Referee grade"
            htmlFor="refereeGrade"
            hint="If known — optional"
          >
            <TextInput
              id="refereeGrade"
              name="refereeGrade"
              defaultValue={referee?.grade ?? ''}
            />
          </Field>
        </div>

        <div className="apply-form__row apply-form__row--align-start">
          {event.divisions.length ? (
            <fieldset className="apply-fieldset">
              <legend>Divisions interested in</legend>
              <p className="apply-fieldset__hint">
                These brackets are for {event.title}. They change with the
                tournament.
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
            <legend>Role(s)</legend>
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
          <Field label="Referee society" htmlFor="refereeSociety">
            <TextInput
              id="refereeSociety"
              name="refereeSociety"
              required
              defaultValue={referee?.society ?? ''}
            />
          </Field>
          <Field
            label="Recommendation contact"
            htmlFor="recommendationContact"
            hint="Optional — name and phone or email"
          >
            <TextInput
              id="recommendationContact"
              name="recommendationContact"
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
            label={`Highest ${formatNoun} competition`}
            htmlFor="highestSevensCompetition"
          >
            <TextSelect
              id="highestSevensCompetition"
              name="highestSevensCompetition"
              required
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
            label="At what level / scope"
            htmlFor="highestSevensScope"
            hint="Was that appointment local, regional, national, or international?"
          >
            <TextSelect
              id="highestSevensScope"
              name="highestSevensScope"
              required
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
            label={`More detail on ${formatNoun} experience`}
            htmlFor="highestSevensNotes"
            hint="Optional — events, years, or notable appointments"
          >
            <TextTextarea id="highestSevensNotes" name="highestSevensNotes" />
          </Field>
        </fieldset>

        <Field
          label="Match footage link"
          htmlFor="matchFootageUrl"
          hint={`Optional — preferably ${formatNoun} (YouTube, Hudl, Google Drive, etc.)`}
        >
          <TextInput
            id="matchFootageUrl"
            name="matchFootageUrl"
            type="url"
            placeholder="https://"
            defaultValue={footageDefault}
          />
        </Field>
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
