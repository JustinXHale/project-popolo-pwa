import { Button } from '../../components/ui/Button'
import { Field, TextSelect } from '../../components/ui/Field'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import { GamesForm } from '../games/GamesForm'
import { AdminEventApplicationDetail } from '../../components/admin/AdminEventApplicationDetail'
import { AdminEventApplicationForms } from '../../components/admin/AdminEventApplicationForms'
import { useState } from 'react'
import {
  DOCUMENT_TYPE_LABELS,
  EVENT_APPLICATION_STATUSES,
  EVENT_APPLICATION_STATUS_LABELS,
  MATCH_FORMAT_LABELS,
  MATCH_GENDER_LABELS,
  REFEREE_POSITION_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  SITE_PAGE_KEYS,
  SITE_PAGE_META,
  displayName,
  formatGameClassification,
  isSitePageEnabled,
  type EventApplicationDoc,
  type EventApplicationStatus,
  type RequestStatus,
  type UserRole,
} from '../../types/models'

export function AdminDashboard() {
  const { profiles, games, documents, media, requests, eventApplications } =
    useData()
  const cards = [
    ['Referees', profiles.length],
    ['Published', profiles.filter((p) => p.published).length],
    ['Games', games.length],
    ['Evaluations', documents.length],
    ['IG photos', media.filter((m) => m.status === 'submitted').length],
    ['Open requests', requests.filter((r) => r.status === 'submitted').length],
    [
      'Event apps',
      eventApplications.filter((app) => app.status === 'submitted').length,
    ],
  ] as const
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="admin-card-grid">
        {cards.map(([label, value]) => (
          <div className="admin-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminRefereesPage() {
  const { profiles, upsertProfile, users, deleteAccount } = useData()
  return (
    <div>
      <h1>Referees</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Society</th>
            <th>Published</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>
                {displayName(p)}
                <div>
                  {users.find((u) => u.uid === p.ownerUid)?.email}
                </div>
              </td>
              <td>{p.society}</td>
              <td>{p.published ? 'Yes' : 'No'}</td>
              <td>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void upsertProfile({
                      ...p,
                      published: !p.published,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  {p.published ? 'Unpublish' : 'Publish'}
                </Button>
                {p.ownerUid.startsWith('seed-') ? null : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Delete ${displayName(p)}?`)) {
                        void deleteAccount(p.ownerUid)
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminGamesPage() {
  const { games, profiles, deleteGame } = useData()
  const rows = [...games].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div>
      <h1>Match log</h1>
      <p>
        Referees update their own logs in the portal. Coaches and admins can add
        or remove appointments here — public profiles refresh immediately.
      </p>
      <GamesForm canPickReferee />
      <h2>All appointments</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>Date</th>
            <th>Referee</th>
            <th>Location</th>
            <th>Format</th>
            <th>Gender</th>
            <th>Type / level</th>
            <th>Role</th>
            <th>Footage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id}>
              <td>{g.tournamentName}</td>
              <td>{g.date}</td>
              <td>
                {displayName(
                  profiles.find((p) => p.id === g.refereeId) ?? {
                    firstName: g.refereeId,
                    lastName: '',
                  },
                )}
              </td>
              <td>{g.location || '—'}</td>
              <td>{MATCH_FORMAT_LABELS[g.format]}</td>
              <td>{g.gender ? MATCH_GENDER_LABELS[g.gender] : '—'}</td>
              <td>{formatGameClassification(g)}</td>
              <td>{REFEREE_POSITION_LABELS[g.role]}</td>
              <td>
                {g.footageUrl ? (
                  <a href={g.footageUrl} target="_blank" rel="noreferrer">
                    Watch
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void deleteGame(g.id)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminEvalsPage() {
  const { documents, profiles } = useData()
  return (
    <div>
      <h1>Evaluations</h1>
      <p>Attach files from the portal as coach or admin.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Referee</th>
            <th>Title</th>
            <th>Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id}>
              <td>
                {displayName(
                  profiles.find((p) => p.id === d.refereeId) ?? {
                    firstName: d.refereeId,
                    lastName: '',
                  },
                )}
              </td>
              <td>
                <a href={d.downloadUrl} target="_blank" rel="noreferrer">
                  {d.title}
                </a>
              </td>
              <td>{DOCUMENT_TYPE_LABELS[d.type]}</td>
              <td>{d.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminPhotosPage() {
  const { media, updateMediaStatus } = useData()
  return (
    <div>
      <h1>IG photo queue</h1>
      <p>
        Stable records for a later generator: id, imageUrl, thumbUrl, caption,
        summary, status, createdAt.
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Caption</th>
            <th>From</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {media.map((m) => (
            <tr key={m.id}>
              <td>
                <img src={m.thumbUrl || m.imageUrl} alt="" width={72} />
              </td>
              <td>
                <strong>{m.caption}</strong>
                <div>{m.summary}</div>
              </td>
              <td>{m.ownerName}</td>
              <td>
                <TextSelect
                  value={m.status}
                  onChange={(e) =>
                    void updateMediaStatus(
                      m.id,
                      e.target.value as typeof m.status,
                    )
                  }
                >
                  <option value="submitted">submitted</option>
                  <option value="used">used</option>
                  <option value="archived">archived</option>
                </TextSelect>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <pre style={{ overflow: 'auto', fontSize: '0.8rem' }}>
        {JSON.stringify(media, null, 2)}
      </pre>
    </div>
  )
}

export function AdminRequestsPage() {
  const { requests, updateRequestStatus } = useData()
  return (
    <div>
      <h1>Service requests</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Organizer</th>
            <th>Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>
                {r.eventName}
                <div>
                  {r.startDate} – {r.endDate} · {r.location}
                </div>
              </td>
              <td>
                {r.organizerName}
                <div>{r.organization}</div>
              </td>
              <td>
                {r.email}
                <div>{r.phone}</div>
              </td>
              <td>
                <TextSelect
                  value={r.status}
                  onChange={(e) =>
                    void updateRequestStatus(
                      r.id,
                      e.target.value as RequestStatus,
                    )
                  }
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {REQUEST_STATUS_LABELS[s]}
                    </option>
                  ))}
                </TextSelect>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminMessagesPage() {
  const { messages } = useData()
  return (
    <div>
      <h1>Contact inbox</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id}>
              <td>
                {m.name}
                <div>{m.email}</div>
              </td>
              <td>{m.subject}</td>
              <td>{m.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminUsersPage() {
  const { users, setUserRole } = useData()
  const { profile } = useAuth()
  return (
    <div>
      <h1>Users &amp; roles</h1>
      <p>Appoint coaches and other admins. You cannot demote the master admin.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td>
                <TextSelect
                  value={u.role}
                  disabled={u.uid === profile?.uid}
                  onChange={(e) =>
                    void setUserRole(u.uid, e.target.value as UserRole)
                  }
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </TextSelect>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminSitePages() {
  const { sitePages, updateSitePages } = useData()
  const [pending, setPending] = useState<string | null>(null)

  async function toggle(key: (typeof SITE_PAGE_KEYS)[number]) {
    if (SITE_PAGE_META[key].alwaysOn) return
    setPending(key)
    try {
      await updateSitePages({ [key]: !sitePages[key] })
    } finally {
      setPending(null)
    }
  }

  return (
    <div>
      <h1>Site pages</h1>
      <p>
        Every public page is listed here. Turn links on or off without a
        deploy. Hidden pages drop out of the header and footer, and their URLs
        send people home. Home, Privacy, and Terms stay on.
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Path</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {SITE_PAGE_KEYS.map((key) => {
            const meta = SITE_PAGE_META[key]
            const on = isSitePageEnabled(sitePages, key)
            return (
              <tr key={key}>
                <td className="admin-table__copy">
                  {meta.label}
                  <div className="admin-table__hint">{meta.hint}</div>
                </td>
                <td>
                  <code>{meta.path}</code>
                </td>
                <td>{meta.alwaysOn ? 'Always on' : on ? 'On' : 'Off'}</td>
                <td>
                  {meta.alwaysOn ? (
                    <span className="admin-table__hint">Required</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={on ? 'secondary' : 'primary'}
                      disabled={pending === key}
                      onClick={() => void toggle(key)}
                    >
                      {on ? 'Turn off' : 'Turn on'}
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type EventApplicationSortKey = 'name' | 'event' | 'society' | 'status'
type SortDirection = 'ascending' | 'descending'
type EmailApplicantGroup = EventApplicationStatus | 'all'

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const input = document.createElement('textarea')
    input.value = value
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }
}

function SortableApplicationHeader({
  label,
  column,
  sortKey,
  direction,
  onSort,
  className,
}: {
  label: string
  column: EventApplicationSortKey
  sortKey: EventApplicationSortKey | 'createdAt'
  direction: SortDirection
  onSort: (column: EventApplicationSortKey) => void
  className?: string
}) {
  const active = sortKey === column
  return (
    <th
      className={className}
      aria-sort={active ? direction : 'none'}
    >
      <button
        type="button"
        className="admin-event-apps__sort"
        onClick={() => onSort(column)}
      >
        {label}
        <span aria-hidden>{active ? (direction === 'ascending' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}

function EmailApplicantsModal({
  applications,
  eventName,
  initialGroup,
  onClose,
}: {
  applications: EventApplicationDoc[]
  eventName: string
  initialGroup: EmailApplicantGroup
  onClose: () => void
}) {
  const [group, setGroup] = useState<EmailApplicantGroup>(initialGroup)
  const [copiedGroup, setCopiedGroup] =
    useState<EmailApplicantGroup | null>(null)
  const groups: Array<{ value: EmailApplicantGroup; label: string }> = [
    { value: 'all', label: 'All applicants' },
    ...EVENT_APPLICATION_STATUSES.map((status) => ({
      value: status,
      label: EVENT_APPLICATION_STATUS_LABELS[status],
    })),
  ]

  function applicationsFor(value: EmailApplicantGroup) {
    return value === 'all'
      ? applications
      : applications.filter((application) => application.status === value)
  }

  function addressesFor(value: EmailApplicantGroup) {
    return [
      ...new Set(
        applicationsFor(value)
          .map((application) => application.email.trim())
          .filter(Boolean),
      ),
    ]
  }

  async function copyAddresses(value: EmailApplicantGroup) {
    const addresses = addressesFor(value)
    if (!addresses.length) return
    await copyText(addresses.join(', '))
    setCopiedGroup(value)
    window.setTimeout(() => setCopiedGroup(null), 1600)
  }

  function openEmail() {
    const addresses = addressesFor(group)
    if (!addresses.length) return
    const groupLabel =
      group === 'all'
        ? 'applicants'
        : `${EVENT_APPLICATION_STATUS_LABELS[group]} applicants`
    const subject = `${eventName} — ${groupLabel}`
    window.location.href = `mailto:?bcc=${encodeURIComponent(addresses.join(','))}&subject=${encodeURIComponent(subject)}`
  }

  return (
    <div
      className="admin-email-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-applicants-title"
    >
      <button
        type="button"
        className="admin-email-modal__backdrop"
        aria-label="Close email applicants"
        onClick={onClose}
      />
      <div className="admin-email-modal__panel">
        <header>
          <h2 id="email-applicants-title">Email applicants</h2>
        </header>
        <p>
          Choose a status group for {eventName}. Open email fills recipients in
          BCC, or copy the addresses into your preferred email app.
        </p>
        <div className="admin-email-modal__groups">
          {groups.map((option, index) => {
            const count = applicationsFor(option.value).length
            return (
              <div className="admin-email-modal__group" key={option.value}>
                <label>
                  <input
                    type="radio"
                    name="email-applicant-group"
                    value={option.value}
                    checked={group === option.value}
                    disabled={count === 0}
                    autoFocus={index === 0}
                    onChange={() => setGroup(option.value)}
                  />
                  <span>
                    {option.label} ({count})
                  </span>
                </label>
                <button
                  type="button"
                  className="admin-email-modal__copy"
                  disabled={count === 0}
                  onClick={() => void copyAddresses(option.value)}
                >
                  {copiedGroup === option.value
                    ? 'Addresses copied'
                    : 'Copy addresses'}
                </button>
              </div>
            )
          })}
        </div>
        <footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={addressesFor(group).length === 0}
            onClick={openEmail}
          >
            Open email
          </Button>
        </footer>
      </div>
    </div>
  )
}

function AdminEventApplicationsList() {
  const { eventApplications, updateEventApplicationStatus } = useData()
  const [selected, setSelected] = useState<EventApplicationDoc | null>(null)
  const [eventFilter, setEventFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<
    EventApplicationStatus | 'all'
  >('all')
  const [sortKey, setSortKey] = useState<
    EventApplicationSortKey | 'createdAt'
  >('createdAt')
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('descending')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const events = [
    ...new Map(
      eventApplications.map((app) => [app.eventSlug, app.eventTitle]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]))
  const rows = eventApplications
    .filter(
      (app) =>
        (eventFilter === 'all' || app.eventSlug === eventFilter) &&
        (statusFilter === 'all' || app.status === statusFilter),
    )
    .sort((a, b) => {
      let comparison = 0
      if (sortKey === 'createdAt') {
        comparison = a.createdAt.localeCompare(b.createdAt)
      } else if (sortKey === 'name') {
        comparison = `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`,
        )
      } else if (sortKey === 'event') {
        comparison = a.eventTitle.localeCompare(b.eventTitle)
      } else if (sortKey === 'society') {
        comparison = a.refereeSociety.localeCompare(b.refereeSociety)
      } else {
        comparison =
          EVENT_APPLICATION_STATUSES.indexOf(a.status) -
          EVENT_APPLICATION_STATUSES.indexOf(b.status)
      }
      return sortDirection === 'ascending' ? comparison : -comparison
    })
  const open = rows.find((app) => app.id === selected?.id) ?? null
  const emailApplications = eventApplications.filter(
    (app) => eventFilter === 'all' || app.eventSlug === eventFilter,
  )
  const emailEventName =
    eventFilter === 'all'
      ? 'all events'
      : events.find(([slug]) => slug === eventFilter)?.[1] || 'this event'

  function sortBy(column: EventApplicationSortKey) {
    if (sortKey === column) {
      setSortDirection((current) =>
        current === 'ascending' ? 'descending' : 'ascending',
      )
      return
    }
    setSortKey(column)
    setSortDirection('ascending')
  }

  return (
    <div>
      <p>Referee applications from public event pages.</p>
      <div className="admin-event-apps__summary" aria-live="polite">
        <strong>Total applicants: {eventApplications.length}</strong>
        {rows.length !== eventApplications.length ? (
          <span>Showing {rows.length}</span>
        ) : null}
      </div>
      <div className="admin-event-apps__filters">
        <Field label="Event" htmlFor="event-application-event-filter">
          <TextSelect
            id="event-application-event-filter"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">All events</option>
            {events.map(([slug, title]) => (
              <option key={slug} value={slug}>
                {title}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Status" htmlFor="event-application-status-filter">
          <TextSelect
            id="event-application-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as EventApplicationStatus | 'all',
              )
            }
          >
            <option value="all">All statuses</option>
            {EVENT_APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </TextSelect>
        </Field>
        <div className="admin-event-apps__email-group">
          <Button
            type="button"
            variant="secondary"
            disabled={emailApplications.length === 0}
            onClick={() => setEmailModalOpen(true)}
          >
            Email applicants ({emailApplications.length})
          </Button>
          <span>Choose a status group, copy addresses, or open email.</span>
        </div>
      </div>
      {eventApplications.length === 0 ? (
        <p>No referee applications yet.</p>
      ) : rows.length === 0 ? (
        <p>No applications match these filters.</p>
      ) : (
        <div className="table-scroll">
          <table className="admin-table admin-event-apps__table">
            <thead>
              <tr>
                <SortableApplicationHeader
                  label="Name"
                  column="name"
                  sortKey={sortKey}
                  direction={sortDirection}
                  onSort={sortBy}
                />
                <SortableApplicationHeader
                  label="Event"
                  column="event"
                  sortKey={sortKey}
                  direction={sortDirection}
                  onSort={sortBy}
                />
                <SortableApplicationHeader
                  label="Society"
                  column="society"
                  sortKey={sortKey}
                  direction={sortDirection}
                  onSort={sortBy}
                  className="admin-event-apps__society"
                />
                <SortableApplicationHeader
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  direction={sortDirection}
                  onSort={sortBy}
                  className="admin-event-apps__status"
                />
                <th></th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((app) => (
                <tr
                  key={app.id}
                  className={
                    app.status === 'accepted'
                      ? 'admin-table__row--accepted'
                      : undefined
                  }
                >
                  <td>
                    {app.firstName} {app.lastName}
                  </td>
                  <td>{app.eventTitle}</td>
                  <td className="admin-event-apps__society">
                    <span title={app.refereeSociety || undefined}>
                      {app.refereeSociety || '—'}
                    </span>
                  </td>
                  <td className="admin-event-apps__status">
                    <TextSelect
                      aria-label={`Status for ${app.firstName} ${app.lastName}`}
                      value={app.status}
                      onChange={(e) =>
                        void updateEventApplicationStatus(
                          app.id,
                          e.target.value as EventApplicationStatus,
                        )
                      }
                    >
                      {EVENT_APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {EVENT_APPLICATION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </TextSelect>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelected(app)}
                    >
                      View
                    </Button>
                  </td>
                  <td>
                    <a href={`mailto:${app.email}`}>Email</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open ? (
        <AdminEventApplicationDetail
          app={open}
          onStatusChange={(status) =>
            void updateEventApplicationStatus(open.id, status)
          }
          onClose={() => setSelected(null)}
        />
      ) : null}
      {emailModalOpen ? (
        <EmailApplicantsModal
          applications={emailApplications}
          eventName={emailEventName}
          initialGroup={statusFilter}
          onClose={() => setEmailModalOpen(false)}
        />
      ) : null}
    </div>
  )
}

export function AdminEventApplicationsPage() {
  const [tab, setTab] = useState<'applications' | 'forms'>('applications')

  return (
    <div>
      <h1>Event applications</h1>
      <div className="admin-subtabs" role="tablist" aria-label="Event apps">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'applications'}
          className={tab === 'applications' ? 'is-active' : undefined}
          onClick={() => setTab('applications')}
        >
          Applications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'forms'}
          className={tab === 'forms' ? 'is-active' : undefined}
          onClick={() => setTab('forms')}
        >
          Forms
        </button>
      </div>
      {tab === 'applications' ? (
        <AdminEventApplicationsList />
      ) : (
        <AdminEventApplicationForms />
      )}
    </div>
  )
}
