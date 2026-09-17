import { useState } from 'react'
import { Button } from './Button'
import { Field, TextInput, YearInput } from './Field'
import {
  emptyResumeEntry,
  sanitizeYearInput,
  type ResumeEntry,
} from '../../types/models'
import './EntryListEditor.css'

export function EntryListEditor({
  entries,
  onChange,
  titleLabel,
  yearLabel = 'Year',
  yearMode = 'single',
  addLabel = 'Add another',
}: {
  entries: ResumeEntry[]
  onChange: (entries: ResumeEntry[]) => void
  titleLabel: string
  yearLabel?: string
  yearMode?: 'single' | 'none'
  addLabel?: string
}) {
  const rows = entries.length ? entries : [emptyResumeEntry()]
  const [yearDrafts, setYearDrafts] = useState<Record<string, string>>({})

  function patch(id: string, next: Partial<ResumeEntry>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...next } : row)))
  }

  function yearValue(row: ResumeEntry): string {
    if (row.id in yearDrafts) return yearDrafts[row.id] ?? ''
    return row.startYear != null ? String(row.startYear) : ''
  }

  return (
    <div className="entry-list">
      {rows.map((row, index) => (
        <div key={row.id} className="entry-list__row">
          <div
            className={
              yearMode === 'none'
                ? 'entry-list__fields entry-list__fields--title'
                : 'entry-list__fields'
            }
          >
            <Field label={titleLabel} htmlFor={`entry-title-${row.id}`}>
              <TextInput
                id={`entry-title-${row.id}`}
                value={row.title}
                onChange={(e) => patch(row.id, { title: e.target.value })}
                autoComplete="off"
              />
            </Field>
            {yearMode === 'single' ? (
              <Field label={yearLabel} htmlFor={`entry-year-${row.id}`}>
                <YearInput
                  id={`entry-year-${row.id}`}
                  value={yearValue(row)}
                  aria-label={yearLabel}
                  onChange={(e) => {
                    const value = sanitizeYearInput(e.target.value)
                    setYearDrafts((drafts) => ({ ...drafts, [row.id]: value }))
                    patch(row.id, {
                      startYear:
                        value.length === 4 ? Number(value) : null,
                      endYear: null,
                    })
                  }}
                />
              </Field>
            ) : null}
          </div>
          {rows.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange(rows.filter((item) => item.id !== row.id))
              }
            >
              Remove
            </Button>
          ) : null}
          {index < rows.length - 1 ? (
            <hr className="entry-list__rule" />
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...rows, emptyResumeEntry()])}
      >
        {addLabel}
      </Button>
    </div>
  )
}
