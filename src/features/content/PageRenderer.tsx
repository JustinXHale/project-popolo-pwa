import { Link } from 'react-router-dom'
import { useData } from '../../context/data-context'
import { renderMarkdown } from '../../lib/markdown'
import {
  CONTENT_EVENTS,
  CONTENT_STORIES,
  peopleInGroup,
} from './loadContent'
import { HomeEventsSection } from '../events/EventPages'
import type { ContentPage, ContentPerson } from './types'
import { ButtonLink } from '../../components/ui/Button'
import { PhotoGrid } from '../../components/media/PhotoLightbox'
import { PortraitPlaceholder } from '../../components/media/PortraitPlaceholder'
import { MeetingsBoard } from '../meetings/MeetingsBoard'
import { RefereeDirectorySection } from '../referees/RefereeDirectorySection'
import { RequestForm } from '../requests/RequestForm'
import { ContactForm } from '../../pages/ContactForm'
import {
  isSitePageEnabled,
  sitePageKeyForPath,
  type SitePhoto,
} from '../../types/models'
import logo from '../../assets/logos/popolo-logo.png'
import './PageRenderer.css'

function PeopleGrid({ people }: { people: ContentPerson[] }) {
  return (
    <ul className="people-grid">
      {people.map((person) => (
        <li key={person.slug}>
          <article className="person-card">
            {person.photo ? (
              <img
                src={person.photo}
                alt={person.name}
                className="person-card__photo"
              />
            ) : (
              <PortraitPlaceholder />
            )}
            <div className="person-card__meta">
              <h3>{person.name}</h3>
              <p>{person.role}</p>
              {person.location ? <p>{person.location}</p> : null}
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

export function PageRenderer({ page }: { page: ContentPage }) {
  const modules = page.modules.length ? page.modules : ['richText']
  const { sitePages } = useData()

  function ctaIsOn(to?: string) {
    if (!to) return false
    const key = sitePageKeyForPath(to)
    return key ? isSitePageEnabled(sitePages, key) : true
  }

  return (
    <article>
      {modules.map((mod, index) => {
        if (mod === 'hero') {
          return (
            <section
              key={`${mod}-${index}`}
              className={page.heroImage ? 'hero' : 'hero hero--mark'}
              style={
                page.heroImage
                  ? { backgroundImage: `url(${page.heroImage})` }
                  : undefined
              }
            >
              {page.heroImage ? null : (
                <img src={logo} alt="" className="hero__mark" />
              )}
              <div className="hero__scrim">
                <div className="container">
                  <h1>{page.heroHeading || page.title}</h1>
                  {page.description ? <p className="lede">{page.description}</p> : null}
                  {page.heroCtaLabel && ctaIsOn(page.heroCtaTo) ? (
                    <ButtonLink to={page.heroCtaTo!} size="lg">
                      {page.heroCtaLabel}
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            </section>
          )
        }
        if (mod === 'richText') {
          const bodyHasH1 = /^\s*#\s+/m.test(page.body)
          return (
            <section key={`${mod}-${index}`} className="section section--paper">
              <div className="container markdown">
                {!page.modules.includes('hero') && !bodyHasH1 ? (
                  <h1>{page.title}</h1>
                ) : null}
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
                />
              </div>
            </section>
          )
        }
        if (mod === 'peopleGrid') {
          const groups: Array<ContentPerson['group']> = (() => {
            if (page.peopleSource === 'all') {
              return [
                'leadership',
                'advisory-domestic',
                'advisory-international',
              ]
            }
            if (page.peopleSource === 'advisory') {
              return ['advisory-domestic', 'advisory-international']
            }
            if (
              page.peopleSource === 'advisory-domestic' ||
              page.peopleSource === 'advisory-international'
            ) {
              return [page.peopleSource]
            }
            return ['leadership']
          })()
          const titles: Record<ContentPerson['group'], string> = {
            leadership: page.peopleHeading || 'Round Table',
            'advisory-domestic': 'Advisory — Domestic',
            'advisory-international': 'Advisory — International',
          }
          return (
            <section
              key={`${mod}-${index}`}
              className="section"
              id={groups.includes('leadership') ? 'round-table' : undefined}
            >
              <div className="container">
                {groups.map((group) => (
                  <div key={group}>
                    {group === 'leadership' ? (
                      <span className="eyebrow">How we work</span>
                    ) : null}
                    <h2>{titles[group]}</h2>
                    {group === 'leadership' ? (
                      <p className="lede">
                        A working circle, not a ladder. Faces will land here
                        once portraits are ready.
                      </p>
                    ) : null}
                    <PeopleGrid people={peopleInGroup(group)} />
                  </div>
                ))}
              </div>
            </section>
          )
        }
        if (mod === 'photoBand') {
          const photos: SitePhoto[] = page.photos.map((src) => ({
            src,
            alt: page.title,
          }))
          return (
            <section key={`${mod}-${index}`} className="section">
              <div className="container">
                <PhotoGrid photos={photos} />
              </div>
            </section>
          )
        }
        if (mod === 'partnerLogos') {
          return (
            <section key={`${mod}-${index}`} className="section section--paper">
              <div className="container">
                <span className="eyebrow">Partners</span>
                <h2>Strategic partnerships</h2>
                <ul className="partner-logos">
                  {[
                    ['/photos/partners/urban-rugby-championship.jpg', 'Urban Rugby Championship'],
                    ['/photos/partners/rhino-hp.jpg', 'Rhino HP'],
                    ['/photos/partners/rugby-foundation.jpg', 'The Rugby Foundation'],
                  ].map(([src, alt]) => (
                    <li key={src}>
                      <img src={src} alt={alt} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )
        }
        if (mod === 'cta') {
          return (
            <section key={`${mod}-${index}`} className="section cta-band">
              <div className="container">
                <h2>{page.ctaHeading || page.title}</h2>
                {page.ctaLabel && ctaIsOn(page.ctaTo) ? (
                  <ButtonLink to={page.ctaTo!} size="lg">
                    {page.ctaLabel}
                  </ButtonLink>
                ) : null}
              </div>
            </section>
          )
        }
        if (mod === 'eventList') {
          if (!isSitePageEnabled(sitePages, 'events') || CONTENT_EVENTS.length === 0) return null
          return <HomeEventsSection key={`${mod}-${index}`} />
        }
        if (mod === 'storyList') {
          if (!isSitePageEnabled(sitePages, 'stories')) return null
          return (
            <section key={`${mod}-${index}`} className="section">
              <div className="container">
                <span className="eyebrow">On the field</span>
                <h2>Trips, camps, news</h2>
                <ul className="story-cards">
                  {CONTENT_STORIES.slice(0, 6).map((story) => (
                    <li key={story.slug}>
                      <Link to={`/stories/${story.slug}`} className="story-card">
                        {story.cover ? (
                          <img src={story.cover} alt="" />
                        ) : null}
                        <div>
                          <p className="eyebrow">{story.category}</p>
                          <h3>{story.title}</h3>
                          <p>{story.date}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <ButtonLink to="/stories" variant="secondary">
                  All stories
                </ButtonLink>
              </div>
            </section>
          )
        }
        if (mod === 'refereeDirectory') {
          return <RefereeDirectorySection key={`${mod}-${index}`} />
        }
        if (mod === 'requestForm') {
          return (
            <section key={`${mod}-${index}`} className="section">
              <div className="container">
                <RequestForm />
              </div>
            </section>
          )
        }
        if (mod === 'contactForm') {
          return (
            <section key={`${mod}-${index}`} className="section">
              <div className="container">
                <ContactForm />
              </div>
            </section>
          )
        }
        if (mod === 'timeline') {
          return (
            <section key={`${mod}-${index}`} className="section section--paper">
              <div
                className="container markdown"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
              />
            </section>
          )
        }
        if (mod === 'meetingsBoard') {
          return (
            <section key={`${mod}-${index}`} className="section">
              <div className="container">
                <MeetingsBoard
                  calendarUrl={page.calendarUrl}
                  minutesUrl={page.minutesUrl}
                  calendarTz={page.calendarTz}
                />
              </div>
            </section>
          )
        }
        return null
      })}
    </article>
  )
}
