import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import { isAdmin, isStaff, isSitePageEnabled, aboutMenuHref, showAboutMenu } from '../../types/models'
import { PhotoViewerProvider } from '../media/PhotoLightbox'
import { ButtonLink } from '../ui/Button'
import logo from '../../assets/logos/popolo-logo.png'
import './PublicLayout.css'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { role, user } = useAuth()
  const { sitePages } = useData()
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <PhotoViewerProvider>
      <div className="public-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container site-header__inner">
            <Link to="/" className="site-header__brand">
              <img src={logo} alt="Project Pōpolo" className="site-logo" />
              <span>Project Pōpolo</span>
            </Link>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
              <span className="sr-only">Menu</span>
            </button>
            <nav
              id="site-nav"
              className={open ? 'site-nav is-open' : 'site-nav'}
            >
              <ul className="site-nav__list">
                {showAboutMenu(sitePages) ? (
                  <li className="site-nav__item site-nav__item--has-sub">
                    <NavLink to={aboutMenuHref(sitePages)} aria-haspopup="true">
                      About
                    </NavLink>
                    <ul className="site-nav__sub">
                      {isSitePageEnabled(sitePages, 'about') ? (
                        <li>
                          <NavLink to="/about" end>
                            The program
                          </NavLink>
                        </li>
                      ) : null}
                      {isSitePageEnabled(sitePages, 'cmoAlign') ? (
                        <li>
                          <NavLink to="/about/align">CMO Align</NavLink>
                        </li>
                      ) : null}
                      {isSitePageEnabled(sitePages, 'calendar') ? (
                        <li>
                          <NavLink to="/about/calendar">
                            Calendar &amp; minutes
                          </NavLink>
                        </li>
                      ) : null}
                      {isSitePageEnabled(sitePages, 'schedule') ? (
                        <li>
                          <NavLink to="/about/schedule">
                            Schedule &amp; timeline
                          </NavLink>
                        </li>
                      ) : null}
                      {isSitePageEnabled(sitePages, 'people') ? (
                        <li>
                          <NavLink to="/about/people">Advisors</NavLink>
                        </li>
                      ) : null}
                    </ul>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'events') ? (
                  <li>
                    <NavLink to="/events">Events</NavLink>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'referees') ? (
                  <li>
                    <NavLink to="/referees">Referees</NavLink>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'stories') ? (
                  <li>
                    <NavLink to="/stories">Stories</NavLink>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'request') ? (
                  <li>
                    <NavLink to="/request">Request</NavLink>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'contact') ? (
                  <li>
                    <NavLink to="/contact">Contact</NavLink>
                  </li>
                ) : null}
              </ul>
              <div className="site-nav__actions">
                {user ? (
                  <>
                    {isAdmin(role) ? (
                      <ButtonLink to="/admin" size="sm" variant="secondary">
                        Admin
                      </ButtonLink>
                    ) : null}
                    {isStaff(role) || role === 'referee' ? (
                      <ButtonLink to="/portal" size="sm" variant="secondary">
                        Portal
                      </ButtonLink>
                    ) : null}
                  </>
                ) : (
                  <ButtonLink to="/login" size="sm">
                    Sign in
                  </ButtonLink>
                )}
              </div>
            </nav>
          </div>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <footer className="site-footer">
          <div className="container site-footer__grid">
            <div>
              <p className="footer-brand">Project Pōpolo</p>
              <p>
                Fostering opportunities for Black and Polynesian rugby referees
                in the USA Rugby pathways.
              </p>
            </div>
            <div>
              <p className="footer-heading">Explore</p>
              <ul>
                {isSitePageEnabled(sitePages, 'events') ? (
                  <li>
                    <Link to="/events">Events</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'referees') ? (
                  <li>
                    <Link to="/referees">Referee directory</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'cmoAlign') ? (
                  <li>
                    <Link to="/about/align">CMO Align</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'calendar') ? (
                  <li>
                    <Link to="/about/calendar">Calendar &amp; minutes</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'stories') ? (
                  <li>
                    <Link to="/stories">Trips &amp; camps</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'request') ? (
                  <li>
                    <Link to="/request">Request Pōpolo</Link>
                  </li>
                ) : null}
                {isSitePageEnabled(sitePages, 'support') ? (
                  <li>
                    <Link to="/support">Support</Link>
                  </li>
                ) : null}
              </ul>
            </div>
            <div>
              <p className="footer-heading">Connect</p>
              <ul>
                <li>
                  <a href="https://www.instagram.com/popolorugby">Instagram</a>
                </li>
                {isSitePageEnabled(sitePages, 'contact') ? (
                  <li>
                    <Link to="/contact">Contact</Link>
                  </li>
                ) : null}
                <li>
                  <Link to="/privacy">Privacy</Link>
                </li>
                <li>
                  <Link to="/terms">Terms</Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="container footer-copy">
            © {new Date().getFullYear()} Project Pōpolo
          </p>
        </footer>
      </div>
    </PhotoViewerProvider>
  )
}
