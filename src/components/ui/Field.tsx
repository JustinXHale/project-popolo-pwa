import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { forwardRef } from 'react'
import './Field.css'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className="field__hint">{hint}</p> : null}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className = '', ...props }, ref) {
  return (
    <input ref={ref} className={`field__control ${className}`.trim()} {...props} />
  )
})

export const YearInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function YearInput({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      inputMode="numeric"
      pattern="[0-9]{4}"
      maxLength={4}
      placeholder="YYYY"
      autoComplete="off"
      className={`field__control ${className}`.trim()}
      {...props}
    />
  )
})

export function TextTextarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`field__control field__control--area ${className}`.trim()}
      {...props}
    />
  )
}

export function TextSelect({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field__control ${className}`.trim()} {...props} />
}

export function YearSelect({
  minYear,
  maxYear,
  value,
  includePresent,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  minYear: number
  maxYear?: number
  includePresent?: boolean
}) {
  const max = maxYear ?? new Date().getFullYear()
  const years = Array.from({ length: max - minYear + 1 }, (_, i) => max - i)
  return (
    <TextSelect {...props} value={value ?? ''}>
      <option value="">Select year</option>
      {includePresent ? <option value="present">Present</option> : null}
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </TextSelect>
  )
}
