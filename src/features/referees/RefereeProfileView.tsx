import { PortraitPlaceholder } from '../../components/media/PortraitPlaceholder'
import { ButtonLink } from '../../components/ui/Button'
import { MatchLogTable } from '../games/MatchLogTable'
import '../content/PageRenderer.css'
import {
  compactResumeEntries,
  displayName,
  formatResumeEntry,
  normalizeResumeEntries,
  ratingLine,
  resumeHasPublicCopy,
  type DocumentDoc,
  type GameDoc,
  type RefereeProfileDoc,
  type ResumeEntry,
} from '../../types/models'

export function RefereeProfileView({
  profile,
  games,
  documents,
  previous,
  next,
  emptyLogLabel,
}: {
  profile: RefereeProfileDoc
  games: GameDoc[]
  documents: DocumentDoc[]
  previous?: RefereeProfileDoc | null
  next?: RefereeProfileDoc | null
  emptyLogLabel?: string
}) {
  const rating = ratingLine(profile.rating)
  const showPager = Boolean(previous && next)

  return (
    <>
      {showPager && previous && next ? (
        <nav className="profile-pager" aria-label="Other referees">
          <ButtonLink
            to={`/referees/${previous.slug}`}
            variant="secondary"
            size="sm"
          >
            Previous · {displayName(previous)}
          </ButtonLink>
          <ButtonLink to={`/referees/${next.slug}`} variant="secondary" size="sm">
            Next · {displayName(next)}
          </ButtonLink>
        </nav>
      ) : null}

      <div className="profile-hero">
        {profile.headshotUrl ? (
          <img src={profile.headshotUrl} alt={displayName(profile)} />
        ) : (
          <PortraitPlaceholder />
        )}
        <div>
          <span className="eyebrow">Referee</span>
          <h1>{displayName(profile)}</h1>
          {rating ? (
            <p className="profile-rating">Rating · {rating}</p>
          ) : null}
          <p>
            {[profile.city, profile.region].filter(Boolean).join(', ')}
            {profile.society ? ` · ${profile.society}` : ''}
          </p>
          {profile.instagram ? (
            <p>
              Instagram:{' '}
              <a
                href={
                  profile.instagram.startsWith('http')
                    ? profile.instagram
                    : `https://instagram.com/${profile.instagram.replace('@', '')}`
                }
              >
                {profile.instagram}
              </a>
            </p>
          ) : null}
          <p className="lede">{profile.bio}</p>
          {profile.startedRefereeingYear || profile.joinedPopoloYear ? (
            <p>
              {profile.startedRefereeingYear
                ? `Refereeing since ${profile.startedRefereeingYear}`
                : null}
              {profile.startedRefereeingYear && profile.joinedPopoloYear
                ? ' · '
                : null}
              {profile.joinedPopoloYear
                ? `Pōpolo since ${profile.joinedPopoloYear}`
                : null}
            </p>
          ) : null}
        </div>
      </div>

      {resumeHasPublicCopy(profile) ? (
        <section className="profile-resume" aria-label="Rugby résumé">
          <h2>Rugby résumé</h2>
          <ResumeEntries
            title="Positions held"
            entries={profile.heldPositions}
          />
          <ResumeEntries
            title="Rugby certifications"
            entries={profile.certifications ?? profile.certificationLevels}
          />
          <ResumeEntries title="Society roles" entries={profile.societyRoles} />
        </section>
      ) : null}

      <section className="profile-experience">
        <h2 className="profile-log-title">Referee experience</h2>
        <p className="profile-experience-hint">
          {resumeHasPublicCopy(profile)
            ? 'This section grows as matches are logged. Résumé details live above.'
            : 'This section grows as matches are logged.'}
        </p>
        <MatchLogTable
          games={games}
          documents={documents}
          emptyLabel={emptyLogLabel}
        />
      </section>
    </>
  )
}

function ResumeEntries({
  title,
  entries,
}: {
  title: string
  entries?: ResumeEntry[] | string
}) {
  const list = compactResumeEntries(normalizeResumeEntries(entries))
  if (!list.length) return null
  return (
    <div className="profile-resume__block">
      <h3>{title}</h3>
      <ul className="profile-resume__list">
        {list.map((entry) => (
          <li key={entry.id}>{formatResumeEntry(entry)}</li>
        ))}
      </ul>
    </div>
  )
}
