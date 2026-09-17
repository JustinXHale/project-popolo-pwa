import { ButtonLink } from '../../components/ui/Button'
import {
  resolveGoogleCalendar,
  resolveGoogleDriveFolder,
} from '../../lib/googleLinks'
import './MeetingsBoard.css'

export function MeetingsBoard({
  calendarUrl,
  minutesUrl,
  calendarTz,
}: {
  calendarUrl?: string
  minutesUrl?: string
  calendarTz?: string
}) {
  const calendar = calendarUrl
    ? resolveGoogleCalendar(calendarUrl, calendarTz || undefined)
    : undefined
  const minutes = minutesUrl ? resolveGoogleDriveFolder(minutesUrl) : undefined

  return (
    <div className="meetings-board">
      <nav className="meetings-jump" aria-label="On this page">
        <a href="#calendar">Calendar</a>
        <a href="#minutes">Minutes</a>
      </nav>
      <div className="meetings-board__grid">
        <section id="calendar" className="meetings-pane">
          <span className="eyebrow">When we meet</span>
          <h2>Calendar</h2>
          <p className="meetings-pane__lede">
            Dates live on the Round Table Google Calendar. Subscribe there so
            you get updates when they happen.
          </p>
          {calendar?.openUrl ? (
            <p className="meetings-pane__actions">
              <ButtonLink to={calendar.openUrl} size="sm">
                Open Google Calendar
              </ButtonLink>
            </p>
          ) : null}
          {calendar?.embedUrl ? (
            <iframe
              className="meetings-embed meetings-embed--calendar"
              title="Round Table calendar"
              src={calendar.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="meetings-pending">
              <p>The public Google Calendar will embed here once the link is set.</p>
            </div>
          )}
        </section>
        <section id="minutes" className="meetings-pane">
          <span className="eyebrow">What was decided</span>
          <h2>Minutes</h2>
          <p className="meetings-pane__lede">
            Notes live in a shared Google Drive folder. Open a file to read or
            download it.
          </p>
          {minutes?.openUrl ? (
            <p className="meetings-pane__actions">
              <ButtonLink to={minutes.openUrl} size="sm">
                Open Drive folder
              </ButtonLink>
            </p>
          ) : null}
          {minutes?.embedUrl ? (
            <iframe
              className="meetings-embed meetings-embed--drive"
              title="Round Table minutes"
              src={minutes.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="meetings-pending">
              <p>The Google Drive folder will embed here once the link is set.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
