import { useState, type FormEvent } from 'react'
import { Field, TextInput, TextTextarea } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { useData } from '../context/data-context'
import { newId } from '../types/models'

export function ContactForm() {
  const { submitContact } = useData()
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    await submitContact({
      id: newId(),
      name: String(fd.get('name') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      subject: String(fd.get('subject') || '').trim(),
      message: String(fd.get('message') || '').trim(),
      honeypot: String(fd.get('website_url') || ''),
      createdAt: new Date().toISOString(),
    })
    setDone(true)
    setPending(false)
  }

  if (done) return <p role="status">Message sent. We will follow up by email.</p>

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <div className="hp" aria-hidden="true">
        <label htmlFor="website_url">Website</label>
        <input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      <Field label="Name" htmlFor="name">
        <TextInput id="name" name="name" required />
      </Field>
      <Field label="Email" htmlFor="email">
        <TextInput id="email" name="email" type="email" required />
      </Field>
      <Field label="Subject" htmlFor="subject">
        <TextInput id="subject" name="subject" required />
      </Field>
      <Field label="Message" htmlFor="message">
        <TextTextarea id="message" name="message" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  )
}
