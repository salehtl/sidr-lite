import type { LinkKind } from '../types'

interface LinkTypeSelectorProps {
  value: LinkKind
  onChange: (value: LinkKind) => void
  className?: string
}

export function LinkTypeSelector({ value, onChange, className = '' }: LinkTypeSelectorProps) {
  return (
    <select
      className={`border rounded-md px-2 py-1 bg-white text-sm ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value as LinkKind)}
    >
      <option value="descendant">Descendant</option>
      <option value="marriage">Marriage</option>
      <option value="divorced">Divorced</option>
      <option value="widowed">Widowed</option>
    </select>
  )
}

