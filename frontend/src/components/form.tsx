import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const base =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} ${props.className ?? ''}`} />
}

export function useFormErrors() {
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = (fn: (e: FormEvent<HTMLFormElement>) => Promise<unknown>) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerErrors({})
    try {
      await fn(e)
    } catch (err) {
      const data = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data
      if (data?.errors) setServerErrors(data.errors)
    }
  }

  return { serverErrors, setServerErrors, handleSubmit }
}
