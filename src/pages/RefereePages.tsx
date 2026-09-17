import { Link, useParams } from 'react-router-dom'
import { RefereeDirectorySection } from '../features/referees/RefereeDirectorySection'
import { RefereeProfileView } from '../features/referees/RefereeProfileView'
import { useData } from '../context/data-context'
import { publishedRefereeDirectory } from '../types/models'

export function RefereesPage() {
  return <RefereeDirectorySection />
}

export function RefereeProfilePage() {
  const { slug } = useParams()
  const { profiles, games, documents } = useData()
  const directory = publishedRefereeDirectory(profiles)
  const profile = directory.find((p) => p.slug === slug)

  if (!profile) {
    return (
      <div className="container section">
        <h1>Referee not found</h1>
        <p>
          <Link to="/referees">Back to the directory</Link>
        </p>
      </div>
    )
  }

  const index = directory.findIndex((p) => p.id === profile.id)
  const previous =
    directory.length > 1
      ? directory[(index - 1 + directory.length) % directory.length]
      : null
  const next =
    directory.length > 1 ? directory[(index + 1) % directory.length] : null

  const log = games
    .filter((g) => g.refereeId === profile.id && g.published)
    .sort((a, b) => b.date.localeCompare(a.date))
  const docs = documents
    .filter((d) => d.refereeId === profile.id && d.published)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="container section">
      <RefereeProfileView
        profile={profile}
        games={log}
        documents={docs}
        previous={previous}
        next={next}
      />
    </div>
  )
}
