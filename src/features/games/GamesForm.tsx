import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
} from '../../components/ui/Field'
import { useAuth } from '../../context/auth-context'
import { useData } from '../../context/data-context'
import { MatchLogTable } from './MatchLogTable'
import {
  MATCH_FORMATS,
  MATCH_FORMAT_LABELS,
  MATCH_GENDERS,
  MATCH_GENDER_LABELS,
  MATCH_TYPES,
  MATCH_TYPE_LABELS,
  MATCH_DIVISION_LABELS,
  REFEREE_POSITIONS,
  REFEREE_POSITION_LABELS,
  displayName,
  divisionsForMatch,
  matchTypeToCompetitionLevel,
  newId,
  normalizeHttpUrl,
  type MatchDivision,
  type MatchFormat,
  type MatchGender,
  type MatchType,
  type RefereePosition,
} from '../../types/models'
import './GamesForm.css'

export function GamesForm({
  lockedRefereeId,
  canPickReferee = false,
}: {
  lockedRefereeId?: string
  canPickReferee?: boolean
}) {
  const { games, profiles, documents, saveGame, saveDocument, uploadBlob, deleteGame } =
    useData()
  const { user, role } = useAuth()
  const uid = useId()
  const [refereeId, setRefereeId] = useState(
    lockedRefereeId || profiles[0]?.id || '',
  )
  const [matchType, setMatchType] = useState<MatchType | ''>('')
  const [gender, setGender] = useState<MatchGender | ''>('')
  const [division, setDivision] = useState<MatchDivision | ''>('')
  const divisions = divisionsForMatch({ type: matchType, gender })
  const activeId = canPickReferee ? refereeId : lockedRefereeId || refereeId
  const mine = games
    .filter((g) => g.refereeId === activeId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const mineDocs = documents.filter((d) => d.refereeId === activeId)

  function syncDivision(
    nextType: MatchType | '',
    nextGender: MatchGender | '',
  ) {
    const allowed = divisionsForMatch({ type: nextType, gender: nextGender })
    if (!allowed.includes(division as MatchDivision)) {
      setDivision('')
    }
  }

  function onMatchTypeChange(next: MatchType | '') {
    setMatchType(next)
    syncDivision(next, gender)
  }

  function onGenderChange(next: MatchGender | '') {
    setGender(next)
    syncDivision(matchType, next)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!activeId || !matchType) return
    const form = e.currentTarget
    const fd = new FormData(form)
    const gameId = newId()
    const date = String(fd.get('date'))
    const footage = normalizeHttpUrl(String(fd.get('footageUrl') || ''))
    const evaluatorName = String(fd.get('evaluatorName') || '').trim()
    const file = fd.get('pdf')
    let evaluationId: string | undefined
    if (file instanceof File && file.size > 0) {
      if (file.type !== 'application/pdf') {
        throw new Error('Evaluation must be a PDF.')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('PDF must be under 10 MB.')
      }
      evaluationId = newId()
      const path = `docs/${activeId}/${Date.now()}-${file.name}`
      const downloadUrl = await uploadBlob(path, file)
      await saveDocument({
        id: evaluationId,
        refereeId: activeId,
        gameId,
        type: 'evaluation',
        title: evaluatorName || 'Evaluation',
        date,
        storagePath: path,
        downloadUrl,
        uploadedByUid: user?.uid ?? '',
        uploadedByRole: role,
        published: true,
        createdAt: new Date().toISOString(),
      })
    }
    const selectedDivision = divisions.length
      ? (String(fd.get('division')) as MatchDivision)
      : null
    await saveGame({
      id: gameId,
      refereeId: activeId,
      createdByUid: user?.uid ?? '',
      date,
      tournamentName: String(fd.get('tournamentName')).trim(),
      location: String(fd.get('location') || '').trim() || undefined,
      format: String(fd.get('format')) as MatchFormat,
      gender: gender || undefined,
      matchType,
      division: selectedDivision || null,
      level: matchTypeToCompetitionLevel(matchType),
      role: String(fd.get('role')) as RefereePosition,
      evaluatorName: evaluatorName || undefined,
      notes: String(fd.get('notes') || '').trim() || undefined,
      footageUrl: footage || undefined,
      evaluationId,
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    form.reset()
    setMatchType('')
    setGender('')
    setDivision('')
  }

  return (
    <div>
      <h2>Match log</h2>
      <p>
        Each appointment can include a footage link and an evaluation PDF. Those
        show as columns on the public profile.
      </p>
      <form
        className="match-log-form"
        onSubmit={(e) => {
          void onSubmit(e).catch((err) => {
            window.alert(err instanceof Error ? err.message : 'Could not save match')
          })
        }}
      >
        {canPickReferee ? (
          <Field label="Referee" htmlFor={`${uid}-ref`}>
            <TextSelect
              id={`${uid}-ref`}
              value={activeId}
              onChange={(e) => setRefereeId(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {displayName(p)}
                </option>
              ))}
            </TextSelect>
          </Field>
        ) : null}

        <div className="match-log-form__row match-log-form__row--title">
          <Field label="Match title" htmlFor={`${uid}-title`}>
            <TextInput
              id={`${uid}-title`}
              name="tournamentName"
              required
              placeholder="Tournament or match name"
            />
          </Field>
          <Field label="Role" htmlFor={`${uid}-role`}>
            <TextSelect id={`${uid}-role`} name="role" defaultValue="center">
              {REFEREE_POSITIONS.map((f) => (
                <option key={f} value={f}>
                  {REFEREE_POSITION_LABELS[f]}
                </option>
              ))}
            </TextSelect>
          </Field>
        </div>

        <div className="match-log-form__row match-log-form__row--meta">
          <Field label="Date" htmlFor={`${uid}-date`}>
            <TextInput id={`${uid}-date`} name="date" type="date" required />
          </Field>
          <Field label="Location" htmlFor={`${uid}-location`}>
            <TextInput
              id={`${uid}-location`}
              name="location"
              placeholder="City, ST"
            />
          </Field>
          <Field label="Format" htmlFor={`${uid}-format`}>
            <TextSelect
              id={`${uid}-format`}
              name="format"
              defaultValue="fifteens"
            >
              {MATCH_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {MATCH_FORMAT_LABELS[f]}
                </option>
              ))}
            </TextSelect>
          </Field>
        </div>

        <div className="match-log-form__row match-log-form__row--class">
          <Field label="Gender" htmlFor={`${uid}-gender`}>
            <TextSelect
              id={`${uid}-gender`}
              name="gender"
              required
              value={gender}
              onChange={(e) =>
                onGenderChange(e.target.value as MatchGender | '')
              }
            >
              <option value="" disabled>
                Select
              </option>
              {MATCH_GENDERS.map((g) => (
                <option key={g} value={g}>
                  {MATCH_GENDER_LABELS[g]}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label="Type" htmlFor={`${uid}-type`}>
            <TextSelect
              id={`${uid}-type`}
              name="matchType"
              required
              value={matchType}
              onChange={(e) => onMatchTypeChange(e.target.value as MatchType | '')}
            >
              <option value="" disabled>
                Select
              </option>
              {MATCH_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MATCH_TYPE_LABELS[t]}
                </option>
              ))}
            </TextSelect>
          </Field>
          {divisions.length ? (
            <Field label="Level" htmlFor={`${uid}-division`}>
              <TextSelect
                id={`${uid}-division`}
                name="division"
                required
                value={division}
                onChange={(e) =>
                  setDivision(e.target.value as MatchDivision | '')
                }
              >
                <option value="" disabled>
                  Select
                </option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {MATCH_DIVISION_LABELS[d]}
                  </option>
                ))}
              </TextSelect>
            </Field>
          ) : (
            <span className="match-log-form__spacer" aria-hidden />
          )}
        </div>

        <div className="match-log-form__row match-log-form__row--eval">
          <Field
            label="Evaluator / CMO"
            htmlFor={`${uid}-evaluator`}
            hint="Optional"
          >
            <TextInput id={`${uid}-evaluator`} name="evaluatorName" />
          </Field>
          <Field
            label="Evaluation PDF"
            htmlFor={`${uid}-pdf`}
            hint="Optional"
          >
            <TextInput
              id={`${uid}-pdf`}
              name="pdf"
              type="file"
              accept="application/pdf"
            />
          </Field>
        </div>

        <Field
          label="Match footage URL"
          htmlFor={`${uid}-footage`}
          hint="Optional public clip for this appointment"
        >
          <TextInput
            id={`${uid}-footage`}
            name="footageUrl"
            type="url"
            placeholder="https://"
          />
        </Field>
        <Field label="Notes" htmlFor={`${uid}-notes`}>
          <TextTextarea id={`${uid}-notes`} name="notes" />
        </Field>
        <Button type="submit" disabled={!activeId}>
          Add match
        </Button>
      </form>
      <MatchLogTable
        games={mine}
        documents={mineDocs}
        onRemove={(id) => void deleteGame(id)}
      />
    </div>
  )
}
