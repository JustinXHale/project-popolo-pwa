import { useState, type FormEvent } from 'react'
import { Field, TextInput, TextSelect, TextTextarea } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { useData } from '../../context/data-context'
import { MATCH_FORMATS, MATCH_FORMAT_LABELS, newId } from '../../types/models'
import type { MatchFormat } from '../../types/models'

export function RequestForm() {
  const { submitRequest } = useData()
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    try {
      await submitRequest({
        id: newId(),
        organizerName: String(fd.get('organizerName') || '').trim(),
        organization: String(fd.get('organization') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        eventName: String(fd.get('eventName') || '').trim(),
        startDate: String(fd.get('startDate') || ''),
        endDate: String(fd.get('endDate') || ''),
        location: String(fd.get('location') || '').trim(),
        format: String(fd.get('format') || '') as MatchFormat | 'both' | '',
        officialsNeeded: String(fd.get('officialsNeeded') || '').trim(),
        notes: String(fd.get('notes') || '').trim(),
        status: 'submitted',
        honeypot: String(fd.get('website_url') || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setDone(true)
      e.currentTarget.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send request.')
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <p role="status">
        Request received. A Pōpolo admin will follow up by email.
      </p>
    )
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website_url">Website</label>
        <input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="auth-page__name-row">
        <Field label="Your name" htmlFor="organizerName">
          <TextInput id="organizerName" name="organizerName" required maxLength={80} />
        </Field>
        <Field label="Organization" htmlFor="organization">
          <TextInput id="organization" name="organization" required maxLength={120} />
        </Field>
      </div>
      <div className="auth-page__name-row">
        <Field label="Email" htmlFor="email">
          <TextInput id="email" name="email" type="email" required />
        </Field>
        <Field label="Phone" htmlFor="phone" hint="Private — not published">
          <TextInput id="phone" name="phone" type="tel" required />
        </Field>
      </div>
      <Field label="Event name" htmlFor="eventName">
        <TextInput id="eventName" name="eventName" required />
      </Field>
      <div className="auth-page__name-row">
        <Field label="Start date" htmlFor="startDate">
          <TextInput id="startDate" name="startDate" type="date" required />
        </Field>
        <Field label="End date" htmlFor="endDate">
          <TextInput id="endDate" name="endDate" type="date" required />
        </Field>
      </div>
      <Field label="Location" htmlFor="location">
        <TextInput id="location" name="location" required />
      </Field>
      <Field label="Format" htmlFor="format">
        <TextSelect id="format" name="format" defaultValue="sevens">
          {MATCH_FORMATS.map((f) => (
            <option key={f} value={f}>
              {MATCH_FORMAT_LABELS[f]}
            </option>
          ))}
          <option value="both">More than one</option>
        </TextSelect>
      </Field>
      <Field label="Officials needed" htmlFor="officialsNeeded">
        <TextInput id="officialsNeeded" name="officialsNeeded" />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <TextTextarea id="notes" name="notes" />
      </Field>
      {error ? <p role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Submit request'}
      </Button>
    </form>
  )
}
