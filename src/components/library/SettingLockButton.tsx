import { LockIcon, UnlockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SettingLockButton({ label, locked, onToggle, disabled = false, compact = false }: { label: string; locked: boolean; onToggle: () => void; disabled?: boolean; compact?: boolean }) {
  const action = locked ? '解锁' : '锁定'
  return <Button type="button" size="sm" variant={locked ? 'secondary' : 'outline'} className={`shrink-0 transition-colors motion-reduce:transition-none ${compact ? 'h-6 gap-1 px-1.5 text-[10px]' : ''}`} disabled={disabled} aria-label={`${action} ${label}`} aria-pressed={locked} title={locked ? '解锁后可参与随机更换' : '锁定后随机保留此项'} onClick={onToggle}>
    {locked ? <LockIcon className="size-3" /> : <UnlockIcon className="size-3" />}{action}
  </Button>
}
