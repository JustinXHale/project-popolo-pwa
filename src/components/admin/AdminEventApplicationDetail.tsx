import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import {
  EVENT_APPLICATION_STATUSES,
  EVENT_APPLICATION_STATUS_LABELS,
  EVENT_CREW_ROLE_LABELS,
  COMPETITION_LEVEL_LABELS,
  MATCH_FORMAT_LABELS,
  eventExperienceNoun,
  formatMailingAddress,
  highestCompetitionLabelsForFormat,
  type EventApplicationDoc,
  type EventApplicationStatus,
} from '../../types/models'

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === '') return null
  return (
    <div className="admin-detail__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function AdminEventApplicationDetail({
  app,
  onStatusChange,
  onClose,
}: {
  app: EventApplicationDoc
  onStatusChange: (status: EventApplicationStatus) => void
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const format = app.eventFormat ?? 'sevens'
  const formatNoun = eventExperienceNoun(format)
  const competitionLabels = highestCompetitionLabelsForFormat(format)

  return (
    <div
      className="admin-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="admin-detail__backdrop"
        aria-label="Close application"
        onClick={onClose}
      />
      <div className="admin-detail__panel">
        <header className="admin-detail__header">
          <div>
            <p className="admin-detail__kind">Referee application</p>
            <h2 id={titleId}>
              {app.firstName} {app.lastName}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="admin-detail__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="admin-detail__status">
          <label htmlFor="admin-event-app-status">Status</label>
          <select
            id="admin-event-app-status"
            value={app.status}
            onChange={(e) =>
              onStatusChange(e.target.value as EventApplicationStatus)
            }
          >
            {EVENT_APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <dl className="admin-detail__grid">
          <DetailRow label="Event">
            {app.eventTitle}
            {` · ${MATCH_FORMAT_LABELS[format]}`}
          </DetailRow>
          <DetailRow label="Email">
            <a href={`mailto:${app.email}`}>{app.email}</a>
          </DetailRow>
          <DetailRow label="Phone">
            <a href={`tel:${app.phone}`}>{app.phone}</a>
          </DetailRow>
          <DetailRow label="Mailing address">
            {formatMailingAddress(app.mailingAddress)}
          </DetailRow>
          <DetailRow label="Years officiating">
            {app.yearsOfficiating}
          </DetailRow>
          <DetailRow label="Grade">{app.refereeGrade}</DetailRow>
          <DetailRow label="Society">{app.refereeSociety}</DetailRow>
          <DetailRow label="Positions">
            {app.positions.map((role) => EVENT_CREW_ROLE_LABELS[role]).join(', ')}
          </DetailRow>
          <DetailRow label="Divisions">{app.divisionCodes.join(', ')}</DetailRow>
          <DetailRow label={`Highest ${formatNoun} competition`}>
            {competitionLabels[app.highestSevensCompetition]}
            {app.highestSevensCompetitionOther
              ? ` — ${app.highestSevensCompetitionOther}`
              : null}
          </DetailRow>
          <DetailRow label={`${formatNoun} scope`}>
            {COMPETITION_LEVEL_LABELS[app.highestSevensScope]}
          </DetailRow>
          <DetailRow label={`${formatNoun} notes`}>
            {app.highestSevensNotes}
          </DetailRow>
          <DetailRow label="Recommendation">
            {app.recommendationContact}
          </DetailRow>
          <DetailRow label="Instagram">{app.instagram}</DetailRow>
          <DetailRow label="Facebook">{app.facebook}</DetailRow>
          <DetailRow label="Match footage">
            {app.matchFootageUrl ? (
              <a href={app.matchFootageUrl} target="_blank" rel="noreferrer">
                {app.matchFootageUrl}
              </a>
            ) : null}
          </DetailRow>
          <DetailRow label="Submitted">
            {new Date(app.createdAt).toLocaleString()}
          </DetailRow>
        </dl>

        <footer className="admin-detail__footer">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  )
}
