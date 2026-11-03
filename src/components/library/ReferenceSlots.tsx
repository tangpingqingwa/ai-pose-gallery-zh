import { Link } from '@tanstack/react-router'
import { AccessibilityIcon, HandIcon, PersonStandingIcon, ScissorsIcon, ShirtIcon, SmileIcon, UserRoundIcon, XIcon } from 'lucide-react'
import { libraryKindForRole } from '@/lib/library'
import { poseThumbPath, referenceImageUrl } from '@/lib/recipeImages'
import { useStudio } from '@/store/studioStore'

export function ReferenceSlots({ compact = false }: { compact?: boolean }) {
  const { recipe, setPortrait, setCostume, setPose, removeExtraImage } = useStudio()
  const extras = recipe.extraImages ?? []
  const slots = [
    { title: '人像', to: '/portraits' as const, icon: UserRoundIcon, image: recipe.portrait?.缩略图, count: recipe.portrait ? 1 : 0, remove: () => setPortrait(null) },
    { title: '穿搭', to: '/costumes' as const, icon: ShirtIcon, image: recipe.costume?.缩略图, count: recipe.costume ? 1 : 0, remove: () => setCostume(null) },
    { title: '姿势', to: '/poses' as const, icon: PersonStandingIcon, image: recipe.pose ? poseThumbPath(recipe.pose) : undefined, count: recipe.pose ? 1 : 0, remove: () => setPose(null) },
    ...([
      ['expressions', '表情', '/expressions', SmileIcon],
      ['grooming', '妆发', '/grooming', ScissorsIcon],
      ['body-details', '体型细节', '/body-details', AccessibilityIcon],
      ['mannerisms', '仪态', '/mannerisms', HandIcon],
    ] as const).map(([kind, title, to, icon]) => {
      const selected = extras.filter((image) => libraryKindForRole(image.role) === kind)
      return { title, to, icon, image: selected[0]?.thumbnail ?? selected[0]?.url, count: selected.length, remove: () => selected.forEach((image) => removeExtraImage(image.id)) }
    }),
  ]
  return <nav aria-label="七类合成参考" className={compact ? 'flex min-w-0 gap-1.5 overflow-x-auto pb-1' : 'grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7'}>
    {slots.map((slot) => <div key={slot.title} className={`relative min-w-0 rounded-lg border bg-background ${compact ? 'w-[88px] shrink-0' : ''}`}>
      <Link to={slot.to} className={`flex min-w-0 items-center gap-2 p-2 ${compact ? 'h-12' : 'h-16'}`} aria-label={`选择${slot.title}参考`}>
        {slot.image ? <img src={referenceImageUrl(slot.image)} alt={`${slot.title}已选参考`} className={`${compact ? 'h-8 w-6' : 'h-11 w-8'} shrink-0 rounded object-cover`} /> : <slot.icon className="size-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 text-xs"><span className="block truncate">{slot.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{slot.count ? `${slot.count} 张` : '可选'}</span></span>
      </Link>
      {slot.count > 0 && <button type="button" onClick={slot.remove} className="absolute right-0.5 top-0.5 rounded bg-background/90 p-0.5 text-muted-foreground hover:text-foreground" aria-label={`清除${slot.title}参考`}><XIcon className="size-3" /></button>}
    </div>)}
  </nav>
}
