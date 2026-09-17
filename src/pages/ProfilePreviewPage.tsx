import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/auth-context'
import { useData } from '../context/data-context'
import { RefereeProfileView } from '../features/referees/RefereeProfileView'
import { createEmptyRefereeProfile } from '../types/models'
import './AuthPages.css'

function appointmentsForPreview<T extends { refereeId: string; date: string }>(
  items: T[],
  refereeId: string,
) {
  return items
    .filter((item) => item.refereeId === refereeId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function ProfilePreviewPage() {
  const { user, profile } = useAuth()
  const { profiles, games, documents } = useData()
  const myProfile =
    profiles.find((p) => p.ownerUid === user?.uid) ??
    (user && profile
      ? createEmptyRefereeProfile(user.uid, profile.firstName, profile.lastName)
      : null)

  if (!user || !profile || !myProfile) {
    return (
      <div className="container section">
        <p>Loading preview…</p>
      </div>
    )
  }

  const log = appointmentsForPreview(games, myProfile.id)
  const docs = appointmentsForPreview(documents, myProfile.id)

  return (
    <div className="container section">
      <div className="profile-preview-banner">
        <div>
          <h2>Profile preview</h2>
          <p>
            {myProfile.published
              ? 'This is how your page looks in the referee directory. It uses your last saved profile.'
              : 'Only you can see this until an admin publishes it. It uses your last saved profile.'}
          </p>
        </div>
        <div className="profile-preview-banner__actions">
          <ButtonLink to="/portal" variant="secondary" size="sm">
            Back to portal
          </ButtonLink>
          {myProfile.published ? (
            <ButtonLink to={`/referees/${myProfile.slug}`} size="sm">
              Open public page
            </ButtonLink>
          ) : null}
        </div>
      </div>
      <RefereeProfileView
        profile={myProfile}
        games={log}
        documents={docs}
        emptyLogLabel="No appointments logged yet."
      />
    </div>
  )
}
