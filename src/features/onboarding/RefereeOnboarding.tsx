import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EntryListEditor } from '../../components/ui/EntryListEditor'
import { TextInput, YearInput } from '../../components/ui/Field'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import { resizeImageFile } from '../../lib/resizeImage'
import {
  MIN_POPOLO_YEAR,
  MIN_REFEREEING_YEAR,
  REFEREE_RATING_LABELS,
  REFEREE_RATING_LEVELS,
  compactResumeEntries,
  createEmptyRefereeProfile,
  gradeForRating,
  isAtLeast18,
  isRefereeRating,
  parseTypedYear,
  resumeEntriesForForm,
  safeNextPath,
  sanitizeYearInput,
  slugifyName,
  yearsSince,
  type ResumeEntry,
} from '../../types/models'
import './onboarding.css'

type StepId =
  | 'firstName'
  | 'lastName'
  | 'birthday'
  | 'society'
  | 'startedRefereeing'
  | 'joinedPopolo'
  | 'rating'
  | 'positions'
  | 'location'
  | 'certification'
  | 'societyRoles'
  | 'photo'

const STEPS: StepId[] = [
  'firstName',
  'lastName',
  'birthday',
  'society',
  'startedRefereeing',
  'joinedPopolo',
  'rating',
  'positions',
  'location',
  'certification',
  'societyRoles',
  'photo',
]

const SKIPPABLE = new Set<StepId>([
  'society',
  'positions',
  'location',
  'certification',
  'societyRoles',
  'photo',
])

const LIST_STEPS = new Set<StepId>([
  'positions',
  'certification',
  'societyRoles',
])

export function RefereeOnboarding() {
  const { user, profile, completeOnboarding } = useAuth()
  const { profiles, upsertProfile, uploadBlob } = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const inputRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const existing =
    profiles.find((item) => item.ownerUid === user?.uid) ??
    (user && profile
      ? createEmptyRefereeProfile(user.uid, profile.firstName, profile.lastName)
      : null)

  const [stepIndex, setStepIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [birthday, setBirthday] = useState(profile?.birthday?.slice(0, 10) ?? '')
  const [society, setSociety] = useState(existing?.society ?? '')
  const [startedRefereeing, setStartedRefereeing] = useState(
    existing?.startedRefereeingYear ? String(existing.startedRefereeingYear) : '',
  )
  const [joinedPopolo, setJoinedPopolo] = useState(
    existing?.joinedPopoloYear ? String(existing.joinedPopoloYear) : '',
  )
  const [rating, setRating] = useState(
    existing?.rating != null ? String(existing.rating) : '',
  )
  const [ratingUnknown, setRatingUnknown] = useState(false)
  const [heldPositions, setHeldPositions] = useState<ResumeEntry[]>(() =>
    resumeEntriesForForm(existing?.heldPositions),
  )
  const [city, setCity] = useState(existing?.city ?? '')
  const [region, setRegion] = useState(existing?.region ?? '')
  const [certifications, setCertifications] = useState<ResumeEntry[]>(() =>
    resumeEntriesForForm(
      existing?.certifications ?? existing?.certificationLevels,
    ),
  )
  const [societyRoles, setSocietyRoles] = useState<ResumeEntry[]>(() =>
    resumeEntriesForForm(existing?.societyRoles),
  )
  const [photoUrl, setPhotoUrl] = useState(existing?.headshotUrl ?? undefined)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)]!
  const progress = ((stepIndex + 1) / STEPS.length) * 100
  const isLast = stepIndex >= STEPS.length - 1
  const copy = stepCopy(step, firstName)

  useEffect(() => {
    if (
      step === 'photo' ||
      step === 'rating' ||
      LIST_STEPS.has(step) ||
      step === 'location'
    ) {
      return
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(timer)
  }, [step, animKey])

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith('blob:')) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  if (!user || !profile || !existing) return null

  const stepValid = (): boolean => {
    switch (step) {
      case 'firstName':
        return Boolean(firstName.trim())
      case 'lastName':
        return Boolean(lastName.trim())
      case 'birthday':
        return isAtLeast18(birthday)
      case 'startedRefereeing':
        return parseTypedYear(startedRefereeing, MIN_REFEREEING_YEAR) != null
      case 'joinedPopolo':
        return parseTypedYear(joinedPopolo, MIN_POPOLO_YEAR) != null
      case 'rating':
        return ratingUnknown || isRefereeRating(Number(rating))
      default:
        return true
    }
  }

  const finish = () => {
    void (async () => {
      setSaving(true)
      setSaveError(null)
      try {
        const started = parseTypedYear(startedRefereeing, MIN_REFEREEING_YEAR)
        const joined = parseTypedYear(joinedPopolo, MIN_POPOLO_YEAR)
        const ratingValue =
          ratingUnknown || !rating ? null : Number(rating)
        await completeOnboarding({
          firstName,
          lastName,
          birthday,
        })
        let headshotUrl = existing.headshotUrl
        let headshotThumbUrl = existing.headshotThumbUrl
        if (photoFile) {
          const full = await resizeImageFile(photoFile, 1200)
          const thumb = await resizeImageFile(photoFile, 400, 0.75)
          headshotUrl = await uploadBlob(
            `headshots/${user.uid}/${Date.now()}.jpg`,
            full,
          )
          headshotThumbUrl = await uploadBlob(
            `headshots/${user.uid}/${Date.now()}-thumb.jpg`,
            thumb,
          )
        }
        await upsertProfile({
          ...existing,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          slug: slugifyName(firstName, lastName) || existing.slug,
          startedRefereeingYear: started,
          joinedPopoloYear: joined,
          yearsOfficiating: yearsSince(started),
          rating: ratingValue,
          grade: gradeForRating(ratingValue),
          society: society.trim(),
          city: city.trim(),
          region: region.trim(),
          heldPositions: compactResumeEntries(heldPositions),
          certifications: compactResumeEntries(certifications).map((entry) => ({
            ...entry,
            startYear: null,
            endYear: null,
          })),
          societyRoles: compactResumeEntries(societyRoles),
          headshotUrl,
          headshotThumbUrl,
          updatedAt: new Date().toISOString(),
        })
        navigate(safeNextPath(next, profile.role), { replace: true })
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'Could not save your profile.',
        )
        setSaving(false)
      }
    })()
  }

  const goNext = () => {
    if (!stepValid()) return
    if (isLast) {
      finish()
      return
    }
    setStepIndex((value) => value + 1)
    setAnimKey((value) => value + 1)
  }

  const goBack = () => {
    if (stepIndex <= 0) return
    setStepIndex((value) => value - 1)
    setAnimKey((value) => value + 1)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !stepValid()) return
    if (
      LIST_STEPS.has(step) ||
      step === 'rating' ||
      step === 'photo' ||
      step === 'location'
    ) {
      return
    }
    event.preventDefault()
    goNext()
  }

  return (
    <div className="rs-onboard">
      <div
        className="rs-onboard__track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}
        aria-label="Onboarding progress"
      >
        <div
          className="rs-onboard__track-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={animKey} className="rs-onboard__panel" onKeyDown={onKeyDown}>
        <p className="rs-onboard__count">
          {stepIndex + 1} / {STEPS.length}
        </p>
        <h1 className="rs-onboard__question">{copy.title}</h1>
        {copy.hint ? <p className="rs-onboard__hint">{copy.hint}</p> : null}

        <div className="rs-onboard__answer">
          {step === 'firstName' ? (
            <TextInput
              ref={inputRef}
              id="ob-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              aria-label="First name"
              className="rs-onboard__input"
              maxLength={60}
            />
          ) : null}
          {step === 'lastName' ? (
            <TextInput
              ref={inputRef}
              id="ob-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              aria-label="Last name"
              className="rs-onboard__input"
              maxLength={60}
            />
          ) : null}
          {step === 'birthday' ? (
            <TextInput
              ref={inputRef}
              id="ob-bday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              aria-label="Birthday"
              className="rs-onboard__input"
            />
          ) : null}
          {step === 'society' ? (
            <TextInput
              ref={inputRef}
              id="ob-society"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              aria-label="Referee society"
              className="rs-onboard__input"
              placeholder="e.g. CARFU-RS"
            />
          ) : null}
          {step === 'startedRefereeing' ? (
            <YearInput
              ref={inputRef}
              id="ob-started"
              value={startedRefereeing}
              onChange={(e) =>
                setStartedRefereeing(sanitizeYearInput(e.target.value))
              }
              aria-label="Year started refereeing"
              className="rs-onboard__input"
            />
          ) : null}
          {step === 'joinedPopolo' ? (
            <YearInput
              ref={inputRef}
              id="ob-joined"
              value={joinedPopolo}
              onChange={(e) =>
                setJoinedPopolo(sanitizeYearInput(e.target.value))
              }
              aria-label="Year joined Pōpolo"
              className="rs-onboard__input"
            />
          ) : null}
          {step === 'rating' ? (
            <div role="radiogroup" aria-label="Rating">
              <div className="rs-onboard__levels">
                {REFEREE_RATING_LEVELS.map((level) => {
                  const selected = !ratingUnknown && rating === String(level)
                  const label = REFEREE_RATING_LABELS[level]
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`rs-onboard__size${
                        selected ? ' rs-onboard__size--selected' : ''
                      }`}
                      onClick={() => {
                        setRatingUnknown(false)
                        setRating(String(level))
                      }}
                    >
                      <strong>{level}</strong>
                      {label ? <span>{label}</span> : null}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                role="radio"
                aria-checked={ratingUnknown}
                className={`rs-onboard__unknown${
                  ratingUnknown ? ' rs-onboard__unknown--selected' : ''
                }`}
                onClick={() => {
                  setRatingUnknown(true)
                  setRating('')
                }}
              >
                I don’t know — add later in Profile
              </button>
            </div>
          ) : null}
          {step === 'positions' ? (
            <EntryListEditor
              titleLabel="Position"
              entries={heldPositions}
              onChange={setHeldPositions}
            />
          ) : null}
          {step === 'location' ? (
            <div className="rs-onboard__place">
              <TextInput
                ref={inputRef}
                id="ob-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                aria-label="City"
                className="rs-onboard__input"
                placeholder="City"
              />
              <TextInput
                id="ob-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                autoComplete="address-level1"
                aria-label="State or region"
                className="rs-onboard__input"
                placeholder="State / region"
              />
            </div>
          ) : null}
          {step === 'certification' ? (
            <EntryListEditor
              titleLabel="Certification"
              yearMode="none"
              entries={certifications}
              onChange={setCertifications}
            />
          ) : null}
          {step === 'societyRoles' ? (
            <EntryListEditor
              titleLabel="Role"
              entries={societyRoles}
              onChange={setSocietyRoles}
            />
          ) : null}
          {step === 'photo' ? (
            <div className="rs-onboard__photo">
              {photoUrl ? (
                <div className="rs-onboard__photo-preview">
                  <img src={photoUrl} alt="" />
                </div>
              ) : null}
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setPhotoFile(file)
                  setPhotoUrl((prev) => {
                    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
                    return URL.createObjectURL(file)
                  })
                  e.target.value = ''
                }}
              />
              <div className="rs-onboard__nav-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => photoRef.current?.click()}
                >
                  {photoUrl ? 'Change photo' : 'Add photo'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rs-onboard__nav">
          {stepIndex > 0 ? (
            <button type="button" className="rs-onboard__back" onClick={goBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          <div className="rs-onboard__nav-end">
            {SKIPPABLE.has(step) ? (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  if (isLast) finish()
                  else {
                    setStepIndex((value) => value + 1)
                    setAnimKey((value) => value + 1)
                  }
                }}
              >
                Skip
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={!stepValid() || saving}
              onClick={goNext}
            >
              {saving ? 'Saving…' : isLast ? 'Finish' : 'Continue'}
            </Button>
          </div>
        </div>
        {saveError ? (
          <p className="rs-onboard__error" role="alert">
            {saveError}
          </p>
        ) : null}
        {step === 'birthday' && birthday && !isAtLeast18(birthday) ? (
          <p className="rs-onboard__error" role="alert">
            Officials must be 18 or older.
          </p>
        ) : null}
        {!LIST_STEPS.has(step) &&
        step !== 'rating' &&
        step !== 'photo' &&
        step !== 'location' ? (
          <p className="rs-onboard__enter">Press Enter to continue</p>
        ) : null}
      </div>
    </div>
  )
}

function stepCopy(
  step: StepId,
  firstName: string,
): { title: string; hint?: string } {
  const name = firstName.trim() || 'there'
  switch (step) {
    case 'firstName':
      return { title: 'What’s your first name?' }
    case 'lastName':
      return { title: 'And your last name?' }
    case 'birthday':
      return {
        title: `When’s your birthday, ${name}?`,
        hint: 'Private — only Pōpolo staff can see this. Officials must be 18+.',
      }
    case 'society':
      return {
        title: 'Which referee society?',
        hint: 'Local union or society name.',
      }
    case 'startedRefereeing':
      return {
        title: 'What year did you start refereeing?',
        hint: 'Type the year — four digits.',
      }
    case 'joinedPopolo':
      return {
        title: 'What year did you join Pōpolo?',
        hint: 'Type the year — four digits.',
      }
    case 'rating':
      return {
        title: 'What’s your rating?',
        hint: 'Choose one. Level 1 is the highest.',
      }
    case 'positions':
      return {
        title: 'Which positions have you held?',
        hint: 'Title and year on one row. Add as many as you need.',
      }
    case 'location':
      return {
        title: 'Where are you based?',
        hint: 'City and state only — no street address.',
      }
    case 'certification':
      return {
        title: 'Any rugby certifications?',
        hint: 'Referee L1, AR L1, and so on. Skip if none.',
      }
    case 'societyRoles':
      return {
        title: 'Roles in your society?',
        hint: 'Treasurer, recruiting, coaching — skip if none.',
      }
    case 'photo':
      return {
        title: 'Add a profile photo?',
        hint: 'Optional. Face-forward crops work best.',
      }
  }
}
