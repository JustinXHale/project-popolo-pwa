type CalendarLinks = {
  openUrl: string
  embedUrl?: string
}

type DriveLinks = {
  openUrl: string
  embedUrl?: string
}

function calendarEmbedFromSrc(src: string, timeZone: string): string {
  const params = new URLSearchParams({
    src,
    ctz: timeZone,
    mode: 'AGENDA',
    showTitle: '0',
    showPrint: '0',
    showCalendars: '0',
    showTz: '0',
    bgcolor: '#0c0c0c',
  })
  return `https://calendar.google.com/calendar/embed?${params.toString()}`
}

function applyCalendarDisplay(
  embedUrl: string,
  timeZone: string,
): string {
  const url = new URL(embedUrl)
  if (!url.searchParams.get('ctz')) {
    url.searchParams.set('ctz', timeZone)
  }
  if (!url.searchParams.get('mode')) {
    url.searchParams.set('mode', 'AGENDA')
  }
  url.searchParams.set('showTitle', '0')
  url.searchParams.set('showPrint', '0')
  url.searchParams.set('showCalendars', '0')
  url.searchParams.set('showTz', '0')
  url.searchParams.set('bgcolor', '#0c0c0c')
  return url.toString()
}

/** Accepts an embed URL, share URL, ical URL, or calendar id. */
export function resolveGoogleCalendar(
  input: string,
  timeZone = 'America/New_York',
): CalendarLinks | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined

  if (!/^https?:\/\//i.test(trimmed)) {
    return {
      openUrl: `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(trimmed)}`,
      embedUrl: calendarEmbedFromSrc(trimmed, timeZone),
    }
  }

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname
    if (!host.includes('google.com') && !host.includes('googleusercontent.com')) {
      return { openUrl: trimmed }
    }

    if (parsed.pathname.includes('/calendar/embed')) {
      const src = parsed.searchParams.get('src')
      return {
        openUrl: src
          ? `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(src)}`
          : trimmed,
        embedUrl: applyCalendarDisplay(parsed.toString(), timeZone),
      }
    }

    const cid = parsed.searchParams.get('cid')
    if (cid) {
      return {
        openUrl: trimmed,
        embedUrl: calendarEmbedFromSrc(cid, timeZone),
      }
    }

    const src = parsed.searchParams.get('src')
    if (src) {
      return {
        openUrl: `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(src)}`,
        embedUrl: calendarEmbedFromSrc(src, timeZone),
      }
    }

    const ical = parsed.pathname.match(/\/ical\/([^/]+)\//)
    if (ical?.[1]) {
      const id = decodeURIComponent(ical[1])
      return {
        openUrl: `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(id)}`,
        embedUrl: calendarEmbedFromSrc(id, timeZone),
      }
    }

    return { openUrl: trimmed }
  } catch {
    return { openUrl: trimmed }
  }
}

function driveFolderId(input: string): string | undefined {
  const folder = input.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (folder?.[1]) return folder[1]
  const id = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return id?.[1]
}

/** Accepts a folder share URL, embed URL, or folder id. */
export function resolveGoogleDriveFolder(input: string): DriveLinks | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined

  const id = driveFolderId(trimmed) || (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) ? trimmed : undefined)

  if (!id) {
    if (/^https?:\/\//i.test(trimmed)) return { openUrl: trimmed }
    return undefined
  }

  let resourceKey: string | undefined
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      resourceKey = new URL(trimmed).searchParams.get('resourcekey') || undefined
    }
  } catch {
    resourceKey = undefined
  }

  const embed = new URL('https://drive.google.com/embeddedfolderview')
  embed.searchParams.set('id', id)
  if (resourceKey) embed.searchParams.set('resourcekey', resourceKey)

  const open = new URL(`https://drive.google.com/drive/folders/${id}`)
  if (resourceKey) open.searchParams.set('resourcekey', resourceKey)

  return {
    openUrl: /^https?:\/\//i.test(trimmed) && trimmed.includes('/folders/')
      ? trimmed
      : open.toString(),
    embedUrl: `${embed.toString()}#list`,
  }
}
