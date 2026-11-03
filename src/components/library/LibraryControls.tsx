import type { ReactNode } from 'react'

export function LibrarySelect({ label, value, values, onChange, all = '全部' }: { label: string; value: string; values: string[]; onChange: (value: string) => void; all?: string }) {
  const id = `library-filter-${label}`
  return <div className="min-w-0 space-y-1.5">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full min-w-0 rounded-md border bg-background px-2.5 text-sm">
      <option value="">{all}</option>
      {[...new Set(values.filter(Boolean))].map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>
}

export function LibraryTabs({ value, options, onChange }: { value: string; options: { value: string; label: string; count: number }[]; onChange: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2" aria-label="素材集">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`rounded-lg border px-3 py-2 text-sm transition-colors ${value === option.value ? 'border-foreground bg-foreground text-background' : 'bg-background text-muted-foreground hover:text-foreground'}`}>{option.label}<span className="ml-2 text-xs opacity-75">{option.count}</span></button>)}</div>
}

export function LibraryBadges({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">{children}</div>
}
