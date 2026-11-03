import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { visualReferencesQuery } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { matchesCatalog } from '@/lib/catalog'
import { REFERENCE_LIBRARIES, referenceIsSelected } from '@/lib/library'
import { useStudio } from '@/store/studioStore'
import type { VisualReferenceItem, VisualReferenceKind } from '@/types/gallery'
import { LibrarySelect } from './LibraryControls'
import { LibraryImageCard } from './LibraryImageCard'
import { LibraryImageDialog } from './LibraryImageDialog'

export function ReferenceLibraryPage({ kind }: { kind: VisualReferenceKind }) {
  const { data: generated } = useSuspenseQuery(visualReferencesQuery)
  const { recipe, setVisualReference, removeExtraImage } = useStudio()
  const config = REFERENCE_LIBRARIES[kind]
  const all = useMemo(() => generated.filter((item) => item.kind === kind), [generated, kind])
  const [query, setQuery] = useState('')
  const [feature, setFeature] = useState('')
  const [viewer, setViewer] = useState<VisualReferenceItem | null>(null)
  const [instruction, setInstruction] = useState('')
  const filtered = all.filter((item) => (!feature || item.feature === feature) && matchesCatalog([item.id, item.title, item.description, ...item.tags].join(' '), query))
  function select(item: VisualReferenceItem, custom?: string) {
    setVisualReference(item, custom)
    toast.success(`已加入${config.short}参考；保留当前人物身份`)
  }
  function open(item: VisualReferenceItem) { setViewer(item); setInstruction(item.instruction) }
  const viewerIndex = viewer ? filtered.findIndex((item) => item.id === viewer.id) : -1
  function move(delta: number) { if (filtered.length) open(filtered[(viewerIndex + delta + filtered.length) % filtered.length]) }
  return <>
    <PageHeader title={config.title} description={config.description} actions={<Button size="sm" asChild><Link to="/studio">前往人物创作</Link></Button>} />
    <div className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-2">
      <div className="space-y-1.5"><label htmlFor={`reference-search-${kind}`} className="text-xs text-muted-foreground">搜索参考</label><Input id={`reference-search-${kind}`} placeholder="关键词、状态、人物或编号" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <LibrarySelect label="参考特点" value={feature} values={all.map((item) => item.feature)} onChange={setFeature} />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs leading-6 text-muted-foreground"><span>{filtered.length} 组可选图片 · 可直接加入合成，无需先建档</span><span>仅取对应状态与细节，当前人像固定身份</span></div>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{filtered.map((item) => <LibraryImageCard key={item.id} id={item.id} title={item.title} thumbnail={item.thumbnail} badges={[item.feature]} description={item.description === item.feature ? undefined : item.description} contain selected={referenceIsSelected(recipe.extraImages, item)} onPreview={() => open(item)} onToggle={() => referenceIsSelected(recipe.extraImages, item) ? removeExtraImage(`library:${item.id}`) : select(item)} />)}</div>
    {!filtered.length && <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">没有匹配的参考。<Button variant="link" onClick={() => { setFeature(''); setQuery('') }}>清除筛选</Button></div>}
    <LibraryImageDialog item={viewer ? { id: viewer.id, title: viewer.title, url: viewer.url, description: viewer.description } : null} onClose={() => setViewer(null)} onPrevious={() => move(-1)} onNext={() => move(1)}>
      {viewer && <><p className="text-xs leading-6 text-muted-foreground">{viewer.ageBand} · {viewer.presentation} · {viewer.feature}{viewer.ownerCharacterId ? ` · 来源角色 ${viewer.ownerCharacterId}` : ''}</p><label className="block space-y-2 text-sm"><span>本次参考目标</span><Textarea aria-label="本次参考目标" value={instruction} rows={5} onChange={(event) => setInstruction(event.target.value)} /></label><p className="text-xs leading-6 text-muted-foreground">参考目标与图片会按同一顺序导出。可以借鉴神态、整理方式或细节表现，保持所选人像的五官和年龄。</p><Button onClick={() => select(viewer, instruction)}>{referenceIsSelected(recipe.extraImages, viewer) ? '更新参考目标' : `加入${config.short}参考`}</Button></>}
    </LibraryImageDialog>
  </>
}
