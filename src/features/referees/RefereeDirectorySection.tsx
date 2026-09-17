import { Link } from 'react-router-dom'
import { PortraitPlaceholder } from '../../components/media/PortraitPlaceholder'
import { useData } from '../../context/data-context'
import { displayName, publishedRefereeDirectory, ratingLine } from '../../types/models'
import '../content/PageRenderer.css'

const DIRECTORY_SLOTS = 12

export function RefereeDirectorySection() {
  const { profiles, loading } = useData()
  const published = publishedRefereeDirectory(profiles)
  const emptySlots = Math.max(0, DIRECTORY_SLOTS - published.length)

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Officials</span>
        <h2>Referee directory</h2>
        <p className="lede">
          Faces, match logs, and evaluations — so Pōpolo referees are not passed
          over. Empty seats show how the grid will fill as officials publish.
        </p>
        {loading ? <p>Loading profiles…</p> : null}
        <ul className="ref-grid">
          {published.map((profile) => (
            <li key={profile.id}>
              <Link to={`/referees/${profile.slug}`} className="ref-card">
                {profile.headshotUrl ? (
                  <img
                    src={profile.headshotUrl}
                    alt={displayName(profile)}
                  />
                ) : (
                  <PortraitPlaceholder />
                )}
                <div className="ref-card__meta">
                  <h3>{displayName(profile)}</h3>
                  {ratingLine(profile.rating) ? (
                    <p>Rating · {ratingLine(profile.rating)}</p>
                  ) : null}
                  <p>
                    {[profile.city, profile.region]
                      .filter(Boolean)
                      .join(', ') ||
                      profile.society}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {Array.from({ length: emptySlots }, (_, index) => (
            <li key={`open-seat-${index}`}>
              <div className="ref-card ref-card--empty">
                <PortraitPlaceholder />
                <div className="ref-card__meta">
                  <h3>Open seat</h3>
                  <p>Coming soon</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
