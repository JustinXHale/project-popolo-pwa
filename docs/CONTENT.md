# Editing pages on GitHub

Marketing pages, people, and stories are Markdown files. Edit, commit, and deploy. You do not need the admin UI for this.

Photos for pages go in `public/photos/` (longest edge about 1920px). User-uploaded headshots and PDFs go to Firebase, not git.

## Add a page

1. Create `content/pages/your-page.md`
2. Set frontmatter:

```
---
path: /your-page
title: Your title
order: 50
modules: hero,richText,cta
heroImage: /photos/stories/nola-camp.jpg
heroHeading: Headline
heroCtaLabel: Meet the referees
heroCtaTo: /referees
ctaHeading: Next step
ctaLabel: Request Pōpolo
ctaTo: /request
---

Markdown body here.
```

3. Add a route in `src/App.tsx` if `path` is new (existing paths are already wired).
4. Merge to `main` so CI deploys.

## Modules

`hero`, `richText`, `peopleGrid`, `photoBand`, `timeline`, `meetingsBoard`, `partnerLogos`, `cta`, `eventList`, `storyList`, `refereeDirectory`, `requestForm`, `contactForm`

Unknown module names are skipped.

`peopleGrid` uses `peopleSource`: `leadership`, `advisory-domestic`, `advisory-international`, or `all`.

`photoBand` uses `photos` as pipe-separated paths: `/photos/a.jpg|/photos/b.jpg`

## Add a person

Create `content/people/slug.md`:

```
---
name: Full Name
role: Title
group: leadership
photo: /photos/people/slug.jpg
slug: slug
location: City
---
```

`group` is `leadership`, `advisory-domestic`, or `advisory-international`.

## Add a story

Create `content/stories/YYYY-MM-title.md`:

```
---
slug: url-slug
title: Title
date: 2025-02-08
category: camps
cover: /photos/stories/file.jpg
photos: /photos/stories/file.jpg|/photos/stories/other.jpg
---

Body copy.
```

Categories: `camp`, `trip`, `news`, `press` (free text is fine).

## Add an event

Create `content/events/slug.md`:

```
---
slug: yellow-rose-showcase
title: Yellow Rose Showcase
summary: Short card copy.
location: Houston, TX
venue: Cullen Park, Houston, TX
startDate: 2027-03-06
endDate: 2027-03-07
format: 7s
cover: /photos/events/file.jpg
photos: /photos/events/file.jpg|/photos/events/other.jpg
applicationsOpen: true
applicationDeadline: 2027-01-15
divisions: Men's Premiere|Men's D1-AA|Men's D2|Women's Rugby
---

Markdown body here.
```

Events show under **Events** in the public nav and as cards on the home page (`eventList` module). Each card has **Apply to be a referee** and **View more information**.

`format` drives the referee application. Use `7s` or `15s` (also `10s`, `league`, `touch`). The shared apply form pre-fills that tournament and swaps **divisions** plus the highest-level 7s / 15s questions to match.

Referee applications are stored in Firebase and reviewed at `/admin/event-applications`.

## Site page toggles

Admins can turn every public page on or off at `/admin/pages` (Home, Privacy, and Terms stay on). That writes a Firestore document; no deploy is required. Hidden pages leave the nav and redirect home.

## Calendar and minutes

Both live on `/about/calendar`. Paste the public Google links into `content/pages/about-calendar.md`:

```
calendarUrl: https://calendar.google.com/calendar/embed?src=YOUR_CALENDAR_ID
minutesUrl: https://drive.google.com/drive/folders/YOUR_FOLDER_ID
calendarTz: America/New_York
```

A share URL, embed URL, or calendar/folder id also works. The calendar must be public for the embed to load. The Drive folder should be “anyone with the link can view.”

## What is not in GitHub

Referee profiles, match logs, evaluation PDFs, IG photo submissions, tournament requests, event referee applications, and public page on/off flags live in Firebase and are edited in the portal / admin.
