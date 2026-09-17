import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/ui/Button'
import { EntryListEditor } from '../components/ui/EntryListEditor'
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  YearInput,
} from '../components/ui/Field'
import { useAuth } from '../context/auth-context'
import { useData } from '../context/data-context'
import { GamesForm } from '../features/games/GamesForm'
import { resizeImageFile } from '../lib/resizeImage'
import './AuthPages.css'
import {
  MIN_POPOLO_YEAR,
  MIN_REFEREEING_YEAR,
  REFEREE_RATING_LABELS,
  REFEREE_RATING_LEVELS,
  compactResumeEntries,
  createEmptyRefereeProfile,
  gradeForRating,
  isAtLeast18,
  isStaff,
  parseTypedYear,
  resumeEntriesForForm,
  sanitizeYearInput,
  slugifyName,
  yearsSince,
  type RefereeProfileDoc,
} from '../types/models'

const PORTAL_TABS = [
  ['profile', 'Profile'],
  ['games', 'Match log'],
  ['account', 'Account'],
] as const

type PortalTab = (typeof PORTAL_TABS)[number][0]

function parsePortalTab(raw: string | null): PortalTab {
  if (raw === 'games' || raw === 'account') return raw
  return 'profile'
}

export function PortalPage() {
  const { user, profile, role, needsOnboarding, signOut } = useAuth()
  const data = useData()
  const staff = isStaff(role)
  const [params, setParams] = useSearchParams()
  const tab = parsePortalTab(params.get('tab'))
  const myProfile =
    data.profiles.find((p) => p.ownerUid === user?.uid) ??
    (user && profile
      ? createEmptyRefereeProfile(user.uid, profile.firstName, profile.lastName)
      : null)

  if (!user || !profile || !myProfile) {
    return (
      <div className="container section">
        <p>Loading portal…</p>
      </div>
    )
  }

  return (
    <div className="container section">
      <span className="eyebrow">{role}</span>
      <h1>Portal</h1>
      <div className="portal-lead">
        <p>
          Signed in as {profile.firstName} {profile.lastName}.{' '}
          {myProfile.published
            ? 'Your profile is live in the referee directory.'
            : 'Not in the public directory yet — preview it anytime.'}
        </p>
        <div className="portal-lead__actions">
          <ButtonLink to="/portal/preview" variant="secondary" size="sm">
            Preview profile
          </ButtonLink>
        </div>
      </div>
      {role === 'referee' && needsOnboarding ? (
        <div className="portal-banner">
          <h2>Start your rugby résumé</h2>
          <p>
            Optional, one question at a time. Personal details, years, rating,
            and your rugby résumé — match-by-match experience grows as you log
            games.
          </p>
          <ButtonLink to="/onboarding">Complete onboarding</ButtonLink>
        </div>
      ) : null}
      <div className="portal-tabs" role="tablist" aria-label="Portal">
        {PORTAL_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`portal-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`portal-panel-${id}`}
            className={`portal-tabs__tab${tab === id ? ' is-active' : ''}`}
            onClick={() =>
              setParams(id === 'profile' ? {} : { tab: id }, { replace: true })
            }
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'profile' ? (
        <div
          role="tabpanel"
          id="portal-panel-profile"
          aria-labelledby="portal-tab-profile"
        >
          <ProfileForm profile={myProfile} />
        </div>
      ) : null}
      {tab === 'games' ? (
        <div
          role="tabpanel"
          id="portal-panel-games"
          aria-labelledby="portal-tab-games"
        >
          <GamesForm
            lockedRefereeId={myProfile.id}
            canPickReferee={staff}
          />
        </div>
      ) : null}
      {tab === 'account' ? (
        <div
          role="tabpanel"
          id="portal-panel-account"
          aria-labelledby="portal-tab-account"
        >
          <h2>Account</h2>
          <p>
            This removes your login, profile, games, documents, and photos from
            Project Pōpolo.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (
                window.confirm(
                  'Delete your account and all associated Firebase data?',
                )
              ) {
                void data.deleteAccount(user.uid)
              }
            }}
          >
            Delete my account
          </Button>
          <p>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ProfileForm({ profile }: { profile: RefereeProfileDoc }) {
  const { profile: account, role, completeOnboarding } = useAuth()
  const { upsertProfile, uploadBlob } = useData()
  const [draft, setDraft] = useState(() => ({
    ...profile,
    heldPositions: resumeEntriesForForm(profile.heldPositions),
    certifications: resumeEntriesForForm(
      profile.certifications ?? profile.certificationLevels,
    ),
    societyRoles: resumeEntriesForForm(profile.societyRoles),
  }))
  const [birthday, setBirthday] = useState(account?.birthday?.slice(0, 10) ?? '')
  const [startedYear, setStartedYear] = useState(
    profile.startedRefereeingYear ? String(profile.startedRefereeingYear) : '',
  )
  const [joinedYear, setJoinedYear] = useState(
    profile.joinedPopoloYear ? String(profile.joinedPopoloYear) : '',
  )
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onHeadshot(file: File | undefined) {
    if (!file) return
    const full = await resizeImageFile(file, 1200)
    const thumb = await resizeImageFile(file, 400, 0.75)
    const url = await uploadBlob(
      `headshots/${profile.ownerUid}/${Date.now()}.jpg`,
      full,
    )
    const thumbUrl = await uploadBlob(
      `headshots/${profile.ownerUid}/${Date.now()}-thumb.jpg`,
      thumb,
    )
    setDraft((d) => ({ ...d, headshotUrl: url, headshotThumbUrl: thumbUrl }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    try {
      if (birthday && !isAtLeast18(birthday)) {
        setMessage('Officials must be 18 or older.')
        return
      }
      const started =
        startedYear.trim() === ''
          ? null
          : parseTypedYear(startedYear, MIN_REFEREEING_YEAR)
      const joined =
        joinedYear.trim() === ''
          ? null
          : parseTypedYear(joinedYear, MIN_POPOLO_YEAR)
      if (startedYear.trim() && started == null) {
        setMessage('Year started refereeing must be a four-digit year.')
        return
      }
      if (joinedYear.trim() && joined == null) {
        setMessage('Year joined Pōpolo must be a four-digit year.')
        return
      }
      await upsertProfile({
        ...draft,
        startedRefereeingYear: started,
        joinedPopoloYear: joined,
        slug: slugifyName(draft.firstName, draft.lastName) || draft.slug,
        yearsOfficiating: yearsSince(started),
        grade: gradeForRating(draft.rating),
        heldPositions: compactResumeEntries(draft.heldPositions ?? []),
        certifications: compactResumeEntries(draft.certifications ?? []).map(
          (entry) => ({ ...entry, startYear: null, endYear: null }),
        ),
        societyRoles: compactResumeEntries(draft.societyRoles ?? []),
        updatedAt: new Date().toISOString(),
      })
      if (
        draft.firstName.trim() &&
        draft.lastName.trim() &&
        isAtLeast18(birthday)
      ) {
        await completeOnboarding({
          firstName: draft.firstName,
          lastName: draft.lastName,
          birthday,
        })
      }
      setMessage('Profile saved.')
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Could not save your profile.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="profile-form" onSubmit={(e) => void onSubmit(e)}>
      <h2>Public profile</h2>
      {role === 'referee' ? (
        <p>
          Prefer one question at a time?{' '}
          <Link to="/onboarding">Open referee onboarding</Link>.
        </p>
      ) : null}
      {draft.headshotUrl ? (
        <img
          src={draft.headshotUrl}
          alt=""
          style={{ width: 160, aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }}
        />
      ) : null}
      <Field label="Profile photo" htmlFor="headshot" hint="Resized in the browser. Face-forward crops work best.">
        <TextInput
          id="headshot"
          type="file"
          accept="image/*"
          onChange={(e) => void onHeadshot(e.target.files?.[0])}
        />
      </Field>
      <div className="profile-form__row profile-form__row--3">
        <Field label="First name" htmlFor="firstName">
          <TextInput
            id="firstName"
            value={draft.firstName}
            onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
            required
          />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <TextInput
            id="lastName"
            value={draft.lastName}
            onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
            required
          />
        </Field>
        <Field
          label="Birthday"
          htmlFor="birthday"
          hint="Private — officials must be 18+."
        >
          <TextInput
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </Field>
      </div>
      <div className="profile-form__row profile-form__row--2">
        <Field label="City" htmlFor="city">
          <TextInput
            id="city"
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          />
        </Field>
        <Field label="State" htmlFor="region">
          <TextInput
            id="region"
            value={draft.region}
            onChange={(e) => setDraft({ ...draft, region: e.target.value })}
          />
        </Field>
      </div>
      <div className="profile-form__row profile-form__row--4">
        <Field label="Referee society" htmlFor="society">
          <TextInput
            id="society"
            value={draft.society}
            onChange={(e) => setDraft({ ...draft, society: e.target.value })}
          />
        </Field>
        <Field label="Rating" htmlFor="rating">
          <TextSelect
            id="rating"
            value={draft.rating ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                rating: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Not set</option>
            {REFEREE_RATING_LEVELS.map((level) => (
              <option key={level} value={level}>
                Level {level} · {REFEREE_RATING_LABELS[level]}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Year started" htmlFor="startedRefereeingYear">
          <YearInput
            id="startedRefereeingYear"
            value={startedYear}
            onChange={(e) => setStartedYear(sanitizeYearInput(e.target.value))}
          />
        </Field>
        <Field label="Year joined Pōpolo" htmlFor="joinedPopoloYear">
          <YearInput
            id="joinedPopoloYear"
            value={joinedYear}
            onChange={(e) => setJoinedYear(sanitizeYearInput(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Bio" htmlFor="bio">
        <TextTextarea
          id="bio"
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
        />
      </Field>
      <h2>Rugby résumé</h2>
      <p>
        Positions, certifications, and society roles. Match appointments belong
        in the match log.
      </p>
      <h3 className="portal-resume-heading">Positions held</h3>
      <EntryListEditor
        titleLabel="Position"
        entries={draft.heldPositions ?? []}
        onChange={(heldPositions) => setDraft({ ...draft, heldPositions })}
      />
      <h3 className="portal-resume-heading">Rugby certifications</h3>
      <EntryListEditor
        titleLabel="Certification"
        yearMode="none"
        entries={draft.certifications ?? []}
        onChange={(certifications) => setDraft({ ...draft, certifications })}
      />
      <h3 className="portal-resume-heading">Society roles</h3>
      <EntryListEditor
        titleLabel="Role"
        entries={draft.societyRoles ?? []}
        onChange={(societyRoles) => setDraft({ ...draft, societyRoles })}
      />
      <Field label="Instagram" htmlFor="ig" hint="Public if you add it">
        <TextInput
          id="ig"
          value={draft.instagram ?? ''}
          onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
        />
      </Field>
      {message ? <p role="status">{message}</p> : null}
      <div className="profile-form__actions">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile'}
        </Button>
        <ButtonLink to="/portal/preview" variant="secondary">
          Preview
        </ButtonLink>
      </div>
    </form>
  )
}
