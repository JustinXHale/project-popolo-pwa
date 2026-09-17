import { Button } from '../../components/ui/Button'
import { TextSelect } from '../../components/ui/Field'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import { GamesForm } from '../games/GamesForm'
import { AdminEventApplicationDetail } from '../../components/admin/AdminEventApplicationDetail'
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

export function AdminEventApplicationsPage() {
  const { eventApplications, updateEventApplicationStatus } = useData()
  const [selected, setSelected] = useState<EventApplicationDoc | null>(null)
  const rows = [...eventApplications].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const open = rows.find((app) => app.id === selected?.id) ?? null

  return (
    <div>
      <h1>Event applications</h1>
      <p>Referee applications from public event pages.</p>
      {rows.length === 0 ? (
        <p>No referee applications yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Event</th>
              <th>Society</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((app) => (
              <tr key={app.id}>
                <td>
                  {app.firstName} {app.lastName}
                  <div>{app.email}</div>
                </td>
                <td>{app.eventTitle}</td>
                <td>{app.refereeSociety || '—'}</td>
                <td>
                  <TextSelect
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
              </tr>
            ))}
          </tbody>
        </table>
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
    </div>
  )
}
