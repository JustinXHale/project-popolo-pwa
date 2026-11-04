import { useState } from 'react'
import { Button } from '../ui/Button'
import { Field, TextInput, TextSelect, TextTextarea } from '../ui/Field'
import { useData } from '../../context/data-context'
import { CONTENT_EVENTS } from '../../features/content/loadContent'
import type { ContentEvent } from '../../features/content/types'
import {
  isCoreApplicationQuestion,
  resolveEventApplicationForm,
} from '../../lib/eventApplicationForms'
import {
  newId,
  type EventApplicationFormDoc,
  type EventApplicationQuestion,
  type EventApplicationQuestionType,
} from '../../types/models'

const QUESTION_TYPES: EventApplicationQuestionType[] = [
  'shortText',
  'longText',
  'number',
  'select',
  'checkboxes',
  'url',
]

const QUESTION_TYPE_LABELS: Record<EventApplicationQuestionType, string> = {
  shortText: 'Short text',
  longText: 'Long text',
  number: 'Number',
  select: 'Dropdown',
  checkboxes: 'Checkboxes',
  url: 'Link / URL',
  address: 'Address',
}

const REQUIRED_IDENTITY_QUESTIONS = new Set([
  'firstName',
  'lastName',
  'email',
  'phone',
])

function FormEditor({
  event,
  saved,
}: {
  event: ContentEvent
  saved?: EventApplicationFormDoc
}) {
  const { saveEventApplicationForm } = useData()
  const resolved = resolveEventApplicationForm(event, saved)
  const [questions, setQuestions] = useState(resolved.questions)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function updateQuestion(
    id: string,
    update: Partial<EventApplicationQuestion>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...update } : question,
      ),
    )
    setMessage(null)
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: `custom-${newId()}`,
        label: 'New question',
        type: 'shortText',
        required: false,
      },
    ])
    setMessage(null)
  }

  function removeQuestion(id: string) {
    setQuestions((current) =>
      current.filter((question) => question.id !== id),
    )
    setMessage(null)
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    const core = questions.filter((question) =>
      isCoreApplicationQuestion(question.id),
    )
    const custom = questions.filter(
      (question) => !isCoreApplicationQuestion(question.id),
    )
    const index = custom.findIndex((question) => question.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= custom.length) return
    const next = [...custom]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setQuestions([...core, ...next])
    setMessage(null)
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const invalidOptions = questions.find(
        (question) =>
          (question.type === 'select' || question.type === 'checkboxes') &&
          !isCoreApplicationQuestion(question.id) &&
          !question.options?.some((option) => option.trim()),
      )
      if (invalidOptions) {
        throw new Error(`Add at least one option to “${invalidOptions.label}”.`)
      }
      await saveEventApplicationForm({
        eventSlug: event.slug,
        questions: questions.map((question) => {
          const hint = question.hint?.trim() ?? ''
          const options = question.options
            ?.map((option) => option.trim())
            .filter(Boolean)
          const usesOptions =
            question.type === 'select' || question.type === 'checkboxes'
          return {
            id: question.id,
            label: question.label.trim() || 'Untitled question',
            type: question.type,
            required:
              REQUIRED_IDENTITY_QUESTIONS.has(question.id) ||
              question.required,
            hint,
            ...(usesOptions && options?.length ? { options } : {}),
          }
        }),
        updatedAt: new Date().toISOString(),
      })
      setMessage('Form saved. New applicants will see these questions.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save this form.',
      )
    } finally {
      setSaving(false)
    }
  }

  const customQuestions = questions.filter(
    (question) => !isCoreApplicationQuestion(question.id),
  )

  return (
    <div className="admin-form-builder">
      <div className="admin-form-builder__heading">
        <div>
          <h2>{event.title}</h2>
          <p>
            Edit labels and requirements for standard questions, or add custom
            questions. Existing applications are not changed.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save form'}
        </Button>
      </div>

      {message ? <p role="status">{message}</p> : null}

      <h3>Standard questions</h3>
      <div className="admin-form-builder__questions">
        {questions
          .filter((question) => isCoreApplicationQuestion(question.id))
          .map((question) => (
            <div className="admin-form-builder__question" key={question.id}>
              <div className="admin-form-builder__question-heading">
                <strong>{question.label}</strong>
                <span>{QUESTION_TYPE_LABELS[question.type]}</span>
              </div>
              <div className="admin-form-builder__row">
                <Field label="Question label" htmlFor={`${question.id}-label`}>
                  <TextInput
                    id={`${question.id}-label`}
                    value={question.label}
                    onChange={(event) =>
                      updateQuestion(question.id, { label: event.target.value })
                    }
                  />
                </Field>
                <Field label="Help text" htmlFor={`${question.id}-hint`}>
                  <TextInput
                    id={`${question.id}-hint`}
                    value={question.hint ?? ''}
                    onChange={(event) =>
                      updateQuestion(question.id, { hint: event.target.value })
                    }
                  />
                </Field>
              </div>
              <label className="admin-form-builder__required">
                <input
                  type="checkbox"
                  checked={question.required}
                  disabled={REQUIRED_IDENTITY_QUESTIONS.has(question.id)}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      required: event.target.checked,
                    })
                  }
                />
                Required
              </label>
            </div>
          ))}
      </div>

      <div className="admin-form-builder__section-heading">
        <div>
          <h3>Custom questions</h3>
          <p>Custom answers appear in the application detail panel.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={addQuestion}>
          Add question
        </Button>
      </div>

      {customQuestions.length === 0 ? (
        <p>No custom questions yet.</p>
      ) : (
        <div className="admin-form-builder__questions">
          {customQuestions.map((question, index) => (
            <div className="admin-form-builder__question" key={question.id}>
              <div className="admin-form-builder__question-heading">
                <strong>{question.label}</strong>
                <div className="admin-form-builder__question-actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => moveQuestion(question.id, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === customQuestions.length - 1}
                    onClick={() => moveQuestion(question.id, 1)}
                  >
                    Move down
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="admin-form-builder__row admin-form-builder__row--3">
                <Field label="Question label" htmlFor={`${question.id}-label`}>
                  <TextInput
                    id={`${question.id}-label`}
                    value={question.label}
                    onChange={(event) =>
                      updateQuestion(question.id, { label: event.target.value })
                    }
                  />
                </Field>
                <Field label="Question type" htmlFor={`${question.id}-type`}>
                  <TextSelect
                    id={`${question.id}-type`}
                    value={question.type}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        type: event.target.value as EventApplicationQuestionType,
                      })
                    }
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
                <Field label="Help text" htmlFor={`${question.id}-hint`}>
                  <TextInput
                    id={`${question.id}-hint`}
                    value={question.hint ?? ''}
                    onChange={(event) =>
                      updateQuestion(question.id, { hint: event.target.value })
                    }
                  />
                </Field>
              </div>
              {question.type === 'select' || question.type === 'checkboxes' ? (
                <Field
                  label="Options"
                  htmlFor={`${question.id}-options`}
                  hint="Enter one option per line."
                >
                  <TextTextarea
                    id={`${question.id}-options`}
                    value={(question.options ?? []).join('\n')}
                    onChange={(event) =>
                      updateQuestion(question.id, {
                        options: event.target.value.split('\n'),
                      })
                    }
                  />
                </Field>
              ) : null}
              <label className="admin-form-builder__required">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      required: event.target.checked,
                    })
                  }
                />
                Required
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminEventApplicationForms() {
  const { eventApplicationForms } = useData()
  const firstEvent =
    CONTENT_EVENTS.find((event) => event.applicationsOpen) ?? CONTENT_EVENTS[0]
  const [eventSlug, setEventSlug] = useState(firstEvent?.slug ?? '')
  const event = CONTENT_EVENTS.find((item) => item.slug === eventSlug)
  const saved = eventApplicationForms.find(
    (form) => form.eventSlug === eventSlug,
  )

  if (!event) return <p>No events are configured.</p>

  return (
    <div>
      <div className="admin-form-builder__event-select">
        <Field label="Event form" htmlFor="event-form-select">
          <TextSelect
            id="event-form-select"
            value={eventSlug}
            onChange={(event) => setEventSlug(event.target.value)}
          >
            {CONTENT_EVENTS.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </TextSelect>
        </Field>
      </div>
      <FormEditor
        key={`${event.slug}-${saved ? 'saved' : 'default'}`}
        event={event}
        saved={saved}
      />
    </div>
  )
}
