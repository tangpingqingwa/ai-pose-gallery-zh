import { CheckIcon, PlusIcon } from 'lucide-react'

export function LibraryImageCard({ id, title, thumbnail, source, badges, description, selected, contain = false, onPreview, onToggle }: {
  id: string; title: string; thumbnail: string; source: string; badges: string[]; description?: string; selected: boolean; contain?: boolean; onPreview: () => void; onToggle: () => void
}) {
  return <article className="library-image-card group min-w-0 rounded-xl border bg-card p-2 transition-shadow hover:shadow-sm">
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted/60">
      <button type="button" className="size-full cursor-zoom-in" onClick={onPreview} aria-label={`预览 ${title}`}>
        <img src={thumbnail} alt={title} loading="lazy" className={`size-full transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none ${contain ? 'object-contain' : 'object-cover object-top'}`} />
      </button>
      <span className="pointer-events-none absolute left-2 top-2 max-w-[65%] truncate rounded bg-black/65 px-1.5 py-1 font-mono text-[9px] text-white">{id}</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-background/90 px-1.5 py-1 text-[9px]">{source}</span>
      <button type="button" onClick={onToggle} aria-label={`${selected ? '移除' : '选择'} ${title}`} className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-white shadow ${selected ? 'bg-emerald-700' : 'bg-black/75 hover:bg-black/90'}`}>
        {selected ? <CheckIcon className="size-3" /> : <PlusIcon className="size-3" />}{selected ? '已加入配方' : '加入配方'}
      </button>
    </div>
    <h2 className="mt-3 line-clamp-2 text-sm font-semibold leading-6">{title}</h2>
    <div className="mt-2 flex flex-wrap gap-1">{badges.filter(Boolean).map((badge) => <span key={badge} className="rounded bg-muted px-1.5 py-1 text-[10px] leading-4 text-muted-foreground">{badge}</span>)}</div>
    {description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</p>}
  </article>
}
