import { Link, useParams } from 'react-router-dom'
import { ButtonLink } from '../../components/ui/Button'
import { PhotoGrid } from '../../components/media/PhotoLightbox'
import { useAuth } from '../../context/auth-context'
import { renderMarkdown } from '../../lib/markdown'
import {
  CONTENT_EVENTS,
  eventBySlug,
  formatEventDeadline,
  formatEventWhen,
} from '../content/loadContent'
import type { ContentEvent } from '../content/types'
import {
  eventApplyPath,
  loginPathFor,
  MATCH_FORMAT_LABELS,
  type SitePhoto,
} from '../../types/models'
import { EventApplyForm } from './EventApplyForm'
import './events.css'

function applyHref(slug: string, signedIn: boolean) {
  const path = eventApplyPath(slug)
  return signedIn ? path : loginPathFor(path)
}

function EventActions({
  event,
  signedIn,
}: {
  event: ContentEvent
  signedIn: boolean
}) {
  if (!event.applicationsOpen) {
    return <p className="event-card__closed">Referee applications are closed.</p>
  }
  return (
    <div className="event-card__actions">
      <ButtonLink to={applyHref(event.slug, signedIn)}>
        Apply to be a referee
      </ButtonLink>
      <ButtonLink to={`/events/${event.slug}`} variant="secondary">
        View more information
      </ButtonLink>
    </div>
  )
}

function EventCard({
  event,
  signedIn,
}: {
  event: ContentEvent
  signedIn: boolean
}) {
  return (
    <article className="event-card">
      {event.cover ? (
        <img src={event.cover} alt="" className="event-card__photo" />
      ) : null}
      <div className="event-card__body">
        <p className="eyebrow">
          {MATCH_FORMAT_LABELS[event.matchFormat] || event.format || 'Event'}
          {event.location ? ` · ${event.location}` : ''}
        </p>
        <h2>
          <Link to={`/events/${event.slug}`}>{event.title}</Link>
        </h2>
        <p className="event-card__when">{formatEventWhen(event)}</p>
        {event.summary ? <p>{event.summary}</p> : null}
        <EventActions event={event} signedIn={signedIn} />
      </div>
    </article>
  )
}

function EventCardList({ signedIn }: { signedIn: boolean }) {
  if (CONTENT_EVENTS.length === 0) {
    return <p>No events posted yet.</p>
  }
  return (
    <ul className="event-cards">
      {CONTENT_EVENTS.map((event) => (
        <li key={event.slug}>
          <EventCard event={event} signedIn={signedIn} />
        </li>
      ))}
    </ul>
  )
}

export function HomeEventsSection() {
  const { user } = useAuth()
  return (
    <section className="section">
      <div className="container events-index">
        <span className="eyebrow">Events</span>
        <h2>Upcoming events</h2>
        <p className="lede">
          Tournaments and showcases where Pōpolo is placing officials.
        </p>
        <EventCardList signedIn={Boolean(user)} />
        <div className="event-card__actions">
          <ButtonLink to="/events" variant="secondary">
            All events
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export function EventsIndexPage() {
  const { user } = useAuth()

  return (
    <div className="container section events-index">
      <span className="eyebrow">Events</span>
      <h1>Upcoming events</h1>
      <p className="lede">
        Tournaments and showcases where Pōpolo is placing officials. Open an
        event for details, or apply to referee from the card.
      </p>
      <EventCardList signedIn={Boolean(user)} />
    </div>
  )
}

export function EventDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const event = slug ? eventBySlug(slug) : undefined
  if (!event) {
    return (
      <div className="container section">
        <h1>Event not found</h1>
        <p>
          <Link to="/events">All events</Link>
        </p>
      </div>
    )
  }

  const photos: SitePhoto[] = (event.photos.length
    ? event.photos
    : event.cover
      ? [event.cover]
      : []
  ).map((src) => ({ src, alt: event.title }))
  const deadline = formatEventDeadline(event.applicationDeadline)
  const signedIn = Boolean(user)

  return (
    <article>
      <section
        className={event.cover ? 'hero' : 'hero hero--mark'}
        style={
          event.cover ? { backgroundImage: `url(${event.cover})` } : undefined
        }
      >
        <div className="hero__scrim">
          <div className="container">
            <span className="eyebrow" style={{ color: 'var(--color-brand-primary)' }}>
              {MATCH_FORMAT_LABELS[event.matchFormat] || event.format || 'Event'}
              {event.location ? ` · ${event.location}` : ''}
            </span>
            <h1>{event.title}</h1>
            <p className="lede">{formatEventWhen(event)}</p>
            {event.applicationsOpen ? (
              <ButtonLink to={applyHref(event.slug, signedIn)} size="lg">
                Apply to be a referee
              </ButtonLink>
            ) : (
              <p>Referee applications are closed.</p>
            )}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container event-detail">
          <p>
            <Link to="/events">← All events</Link>
          </p>
          {event.venue ? <p>{event.venue}</p> : null}
          {deadline ? (
            <p>Application deadline: {deadline}.</p>
          ) : event.applicationsOpen ? (
            <p>Applications are open and reviewed as they come in.</p>
          ) : null}
          <div
            className="markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(event.body) }}
          />
          {photos.length ? <PhotoGrid photos={photos} /> : null}
          {event.applicationsOpen ? (
            <div className="event-detail__cta">
              <ButtonLink to={applyHref(event.slug, signedIn)} size="lg">
                Apply to be a referee
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </section>
    </article>
  )
}

export function EventApplyPage() {
  const { slug } = useParams()
  const event = slug ? eventBySlug(slug) : undefined
  if (!event) {
    return (
      <div className="container section">
        <h1>Event not found</h1>
        <p>
          <Link to="/events">All events</Link>
        </p>
      </div>
    )
  }

  if (!event.applicationsOpen) {
    return (
      <div className="container section apply-form-page">
        <h1>Applications closed</h1>
        <p>Referee applications are not open for {event.title}.</p>
        <ButtonLink to={`/events/${event.slug}`} variant="secondary">
          Back to event
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="container section apply-form-page">
      <p className="apply-form-page__back">
        <Link to={`/events/${event.slug}`}>← {event.title}</Link>
      </p>
      <EventApplyForm key={event.slug} event={event} />
    </div>
  )
}

export function EventApplySubmittedPage() {
  const { slug } = useParams()
  const event = slug ? eventBySlug(slug) : undefined
  return (
    <div className="container section apply-form-page">
      <h1>Application submitted</h1>
      <p role="status">
        Your referee application
        {event ? ` for ${event.title}` : ''} was received. We&apos;ll review it
        and follow up by email.
      </p>
      <div className="event-card__actions" style={{ marginTop: '1.5rem' }}>
        <ButtonLink to={event ? `/events/${event.slug}` : '/events'}>
          {event ? 'Back to event' : 'All events'}
        </ButtonLink>
        <ButtonLink to="/events" variant="secondary">
          All events
        </ButtonLink>
      </div>
    </div>
  )
}
