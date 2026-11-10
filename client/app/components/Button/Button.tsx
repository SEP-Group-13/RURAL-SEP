import type { ButtonHTMLAttributes } from 'react'

export default function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`px-2 py-1 rounded bg-sidebar-surface cursor-pointer disabled:opacity-50 disabled:cursor-default ${className}`}
      {...props}
    />
  )
}
