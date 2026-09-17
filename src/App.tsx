import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider } from './context/AuthProvider'
import { DataProvider } from './context/DataProvider'
import { ScrollToTop } from './components/ScrollToTop'
import { PublicLayout } from './components/layout/PublicLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { RequireAuth } from './components/auth/RequireAuth'
import { MarkdownPage } from './pages/MarkdownPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { RefereesPage, RefereeProfilePage } from './pages/RefereePages'
import { StoriesIndexPage, StoryPage } from './pages/StoryPages'
import { PortalPage } from './pages/PortalPage'
import { ProfilePreviewPage } from './pages/ProfilePreviewPage'
import {
  AdminDashboard,
  AdminEvalsPage,
  AdminEventApplicationsPage,
  AdminGamesPage,
  AdminMessagesPage,
  AdminPhotosPage,
  AdminRefereesPage,
  AdminRequestsPage,
  AdminSitePages,
  AdminUsersPage,
} from './features/admin/AdminPages'
import {
  EventApplyPage,
  EventApplySubmittedPage,
  EventDetailPage,
  EventsIndexPage,
} from './features/events/EventPages'
import { pageByPath } from './features/content/loadContent'
import { PageRenderer } from './features/content/PageRenderer'
import { useData } from './context/data-context'
import { isSitePageEnabled, type SitePageKey } from './types/models'

function ContentRoute({ path }: { path: string }) {
  return <MarkdownPage path={path} />
}

function GatedRoute({
  page,
  children,
}: {
  page: SitePageKey
  children: ReactNode
}) {
  const { sitePages } = useData()
  if (!isSitePageEnabled(sitePages, page)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const home = pageByPath('/')
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route
                index
                element={
                  home ? <PageRenderer page={home} /> : <ContentRoute path="/" />
                }
              />
              <Route
                path="about"
                element={
                  <GatedRoute page="about">
                    <ContentRoute path="/about" />
                  </GatedRoute>
                }
              />
              <Route
                path="about/calendar"
                element={
                  <GatedRoute page="calendar">
                    <ContentRoute path="/about/calendar" />
                  </GatedRoute>
                }
              />
              <Route
                path="about/minutes"
                element={<Navigate to="/about/calendar#minutes" replace />}
              />
              <Route
                path="about/minutes/:slug"
                element={<Navigate to="/about/calendar#minutes" replace />}
              />
              <Route
                path="about/schedule"
                element={
                  <GatedRoute page="schedule">
                    <ContentRoute path="/about/schedule" />
                  </GatedRoute>
                }
              />
              <Route
                path="about/align"
                element={
                  <GatedRoute page="cmoAlign">
                    <ContentRoute path="/about/align" />
                  </GatedRoute>
                }
              />
              <Route
                path="about/people"
                element={
                  <GatedRoute page="people">
                    <ContentRoute path="/about/people" />
                  </GatedRoute>
                }
              />
              <Route
                path="referees"
                element={
                  <GatedRoute page="referees">
                    <Outlet />
                  </GatedRoute>
                }
              >
                <Route index element={<RefereesPage />} />
                <Route path=":slug" element={<RefereeProfilePage />} />
              </Route>
              <Route
                path="events"
                element={
                  <GatedRoute page="events">
                    <Outlet />
                  </GatedRoute>
                }
              >
                <Route index element={<EventsIndexPage />} />
                <Route path=":slug" element={<EventDetailPage />} />
                <Route
                  path=":slug/apply"
                  element={
                    <RequireAuth>
                      <EventApplyPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path=":slug/apply/submitted"
                  element={<EventApplySubmittedPage />}
                />
              </Route>
              <Route
                path="stories"
                element={
                  <GatedRoute page="stories">
                    <StoriesIndexPage />
                  </GatedRoute>
                }
              />
              <Route
                path="stories/:slug"
                element={
                  <GatedRoute page="stories">
                    <StoryPage />
                  </GatedRoute>
                }
              />
              <Route
                path="request"
                element={
                  <GatedRoute page="request">
                    <ContentRoute path="/request" />
                  </GatedRoute>
                }
              />
              <Route
                path="contact"
                element={
                  <GatedRoute page="contact">
                    <ContentRoute path="/contact" />
                  </GatedRoute>
                }
              />
              <Route
                path="support"
                element={
                  <GatedRoute page="support">
                    <ContentRoute path="/support" />
                  </GatedRoute>
                }
              />
              <Route path="privacy" element={<ContentRoute path="/privacy" />} />
              <Route path="terms" element={<ContentRoute path="/terms" />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route
                path="portal"
                element={
                  <RequireAuth>
                    <PortalPage />
                  </RequireAuth>
                }
              />
              <Route
                path="portal/preview"
                element={
                  <RequireAuth>
                    <ProfilePreviewPage />
                  </RequireAuth>
                }
              />
              <Route path="shop" element={<Navigate to="/" replace />} />
              <Route
                path="my-account"
                element={<Navigate to="/portal?tab=account" replace />}
              />
              <Route path="cart" element={<Navigate to="/" replace />} />
              <Route path="checkout" element={<Navigate to="/" replace />} />
            </Route>

            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pages" element={<AdminSitePages />} />
              <Route
                path="event-applications"
                element={<AdminEventApplicationsPage />}
              />
              <Route path="referees" element={<AdminRefereesPage />} />
              <Route path="games" element={<AdminGamesPage />} />
              <Route path="evaluations" element={<AdminEvalsPage />} />
              <Route path="photos" element={<AdminPhotosPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}
