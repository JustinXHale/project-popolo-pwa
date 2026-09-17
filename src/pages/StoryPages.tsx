import { Link, useParams } from 'react-router-dom'
import { renderMarkdown } from '../lib/markdown'
import { CONTENT_STORIES, storyBySlug } from '../features/content/loadContent'
import { PhotoGrid } from '../components/media/PhotoLightbox'
import type { SitePhoto } from '../types/models'

export function StoriesIndexPage() {
  return (
    <div className="container section">
      <span className="eyebrow">Stories</span>
      <h1>Trips, camps, and news</h1>
      <ul className="story-cards">
        {CONTENT_STORIES.map((story) => (
          <li key={story.slug}>
            <Link to={`/stories/${story.slug}`} className="story-card">
              {story.cover ? <img src={story.cover} alt="" /> : null}
              <div>
                <p className="eyebrow">{story.category}</p>
                <h2>{story.title}</h2>
                <p>{story.date}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StoryPage() {
  const { slug } = useParams()
  const story = slug ? storyBySlug(slug) : undefined
  if (!story) {
    return (
      <div className="container section">
        <h1>Story not found</h1>
        <p>
          <Link to="/stories">All stories</Link>
        </p>
      </div>
    )
  }
  const photos: SitePhoto[] = (story.photos.length ? story.photos : [story.cover])
    .filter(Boolean)
    .map((src) => ({ src, alt: story.title }))
  return (
    <article className="container section">
      <p>
        <Link to="/stories">All stories</Link>
      </p>
      <span className="eyebrow">{story.category}</span>
      <h1>{story.title}</h1>
      <p>{story.date}</p>
      {story.cover ? (
        <img
          src={story.cover}
          alt=""
          style={{
            width: '100%',
            maxHeight: 520,
            objectFit: 'cover',
            objectPosition: 'top',
            marginBottom: 24,
          }}
        />
      ) : null}
      <div
        className="markdown"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(story.body) }}
      />
      <PhotoGrid photos={photos} />
    </article>
  )
}
