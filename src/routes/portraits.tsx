import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { portraitsQuery } from '@/api/gallery'
import ranking from '../../data/portrait-meta-zh.json'
import expansion from '../../data/catalog-expansion.json'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LibrarySelect } from '@/components/library/LibraryControls'
import { LibraryImageCard } from '@/components/library/LibraryImageCard'
import { LibraryImageDialog } from '@/components/library/LibraryImageDialog'
import { matchesCatalog, matchesPortraitAge, matchesPortraitRegion } from '@/lib/catalog'
import { portraitFor } from '@/lib/characters'
import { portraitClassification, portraitFringe, portraitHairFamily } from '@/lib/library'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useCharacterLibrary } from '@/store/characterStore'
import { useStudio } from '@/store/studioStore'
import type { PortraitItem } from '@/types/gallery'

export const Route = createFileRoute('/portraits')({ staticData: { title: '人像参考库' }, loader: ({ context }) => context.queryClient.ensureQueryData(portraitsQuery), component: PortraitsPage })

const emptyFilters = () => ({ age: '', presentation: '', skin: '', body: '', market: '', designRegion: '', hair: '', family: '', fringe: '', face: '', beard: '', section: '', query: '' })
const capture = (item: PortraitItem) => item.catalog ? '人物身份' : /氛围/.test(item.分区) ? '造型氛围' : '发型正脸'

function PortraitsPage() {
  const { data } = useSuspenseQuery(portraitsQuery)
  const { profiles } = useCharacterLibrary()
  const { recipe, togglePortrait, setCharacter, setPortrait } = useStudio()
  const own = useMemo(() => profiles.map((profile) => portraitFor(profile, expansion.seedPreviews)).filter((item): item is PortraitItem => Boolean(item)), [profiles])
  const added = data.filter((item) => item.source === 'catalog')
  const original = data.filter((item) => item.source !== 'catalog')
  const all = [...added, ...own, ...original]
  const [filters, setFilters] = useState(emptyFilters)
  const [onlyRanked, setOnlyRanked] = useState(false)
  const [shown, setShown] = useState(24)
  const [viewer, setViewer] = useState<PortraitItem | null>(null)
  const scoped = all
  const rankIds = new Set(ranking.排行榜Top10[(filters.hair || '综合') as keyof typeof ranking.排行榜Top10] ?? [])
  const filtered = scoped.filter((item) => {
    const c = portraitClassification(item)
    return matchesPortraitAge(c.age, c.ageBand, filters.age) && matchesPortraitRegion(c.designRegion, filters.designRegion) && (!filters.presentation || c.presentation === filters.presentation) && (!filters.skin || c.skinTone === filters.skin) && (!filters.body || c.bodyDesign === filters.body) && (!filters.market || c.market.includes(filters.market)) && (!filters.hair || item.发长 === filters.hair) && (!filters.family || portraitHairFamily(item) === filters.family) && (!filters.fringe || portraitFringe(item) === filters.fringe) && (!filters.face || c.faceShape === filters.face) && (!filters.beard || c.facialHair === filters.beard) && (!filters.section || capture(item) === filters.section) && (!onlyRanked || rankIds.has(item.id)) && matchesCatalog([item.检索, c.appearance, c.ageBand, c.presentation, c.market, c.designRegion, c.bodyDesign, c.faceShape, c.facialHair].join(' '), filters.query)
  })
  function patch(key: keyof ReturnType<typeof emptyFilters>, value: string) { setFilters({ ...filters, [key]: value }); setShown(24); setViewer(null) }
  function select(item: PortraitItem) {
    const profile = item.source === 'character' ? profiles.find((p) => `character:${p.id}` === item.id) : undefined
    if (profile) { if (recipe.character?.id === profile.id) setPortrait(null); else setCharacter(profile) }
    else togglePortrait(item)
  }
  const viewerIndex = viewer ? filtered.findIndex((item) => item.id === viewer.id) : -1
  function move(delta: number) { if (filtered.length) setViewer(filtered[(viewerIndex + delta + filtered.length) % filtered.length]) }
  return <>
    <PageHeader title="人像参考库" description="按年龄、形象、体型与发型寻找人物身份，再关联穿搭、状态和个性记录。" actions={<Button size="sm" asChild><Link to="/studio">前往人物创作</Link></Button>} />
    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
      <div className="flex flex-wrap gap-3"><Input aria-label="搜索人像" placeholder="人物、年龄、外貌、发型或编号，可用空格组合关键词" className="min-w-48 flex-1" value={filters.query} onChange={(event) => patch('query', event.target.value)} /><Button variant="ghost" onClick={() => { setFilters(emptyFilters()); setOnlyRanked(false); setShown(24) }}>重置筛选</Button></div>
      <div className="flex flex-wrap gap-2" aria-label="常用人像筛选">{[['designRegion', '亚洲（全部）', '亚洲'], ['presentation', '男性', '男性'], ['presentation', '女性', '女性'], ['age', '45岁及以上', '45岁及以上'], ['age', '60+', '60岁及以上']].map(([key, value, label]) => <Button key={label} size="sm" variant={filters[key as 'age' | 'presentation' | 'designRegion'] === value ? 'secondary' : 'outline'} aria-pressed={filters[key as 'age' | 'presentation' | 'designRegion'] === value} onClick={() => { setOnlyRanked(false); patch(key as 'age' | 'presentation' | 'designRegion', filters[key as 'age' | 'presentation' | 'designRegion'] === value ? '' : value) }}>{label}</Button>)}</div>
      <details><summary className="cursor-pointer text-xs font-medium">外观与拍摄分类</summary><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <LibrarySelect label="年龄设定" value={filters.age} values={['18–29', '30–44', '45–59', '60+', '45岁及以上', '未标注']} onChange={(value) => patch('age', value)} />
        <LibrarySelect label="性别形象" value={filters.presentation} values={scoped.map((item) => portraitClassification(item).presentation)} onChange={(value) => patch('presentation', value)} />
        <LibrarySelect label="肤色设定" value={filters.skin} values={scoped.map((item) => portraitClassification(item).skinTone)} onChange={(value) => patch('skin', value)} />
        <LibrarySelect label="体型设定" value={filters.body} values={scoped.map((item) => portraitClassification(item).bodyDesign)} onChange={(value) => patch('body', value)} />
        <LibrarySelect label="创作定位" value={filters.market} values={scoped.map((item) => portraitClassification(item).market)} onChange={(value) => patch('market', value)} />
        <LibrarySelect label="外观设计方向" value={filters.designRegion} values={['亚洲（全部）', ...scoped.map((item) => portraitClassification(item).designRegion ?? '未标注')]} onChange={(value) => patch('designRegion', value)} />
        <LibrarySelect label="发长" value={filters.hair} values={['短发', '中发', '中长发', '长发']} onChange={(value) => patch('hair', value)} />
        <LibrarySelect label="发型家族" value={filters.family} values={scoped.map(portraitHairFamily)} onChange={(value) => patch('family', value)} />
        <LibrarySelect label="刘海" value={filters.fringe} values={scoped.map(portraitFringe)} onChange={(value) => patch('fringe', value)} />
        <LibrarySelect label="脸型设定" value={filters.face} values={scoped.map((item) => portraitClassification(item).faceShape ?? '未标注')} onChange={(value) => patch('face', value)} />
        <LibrarySelect label="胡须设定" value={filters.beard} values={scoped.map((item) => portraitClassification(item).facialHair ?? '未标注')} onChange={(value) => patch('beard', value)} />
        <LibrarySelect label="拍摄类型" value={filters.section} values={['人物身份', '发型正脸', '造型氛围']} onChange={(value) => patch('section', value)} />
      </div><Button className="mt-3" size="sm" variant={onlyRanked ? 'secondary' : 'outline'} onClick={() => { setOnlyRanked(!onlyRanked); setShown(24) }}>{filters.hair || '综合'}发型 Top10</Button></details>
    </div>
    <p className="text-xs text-muted-foreground">{filtered.length} 张可选图片</p>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{filtered.slice(0, shown).map((item) => {
      const c = portraitClassification(item)
      const legacy = c.collection === 'original'
      return <LibraryImageCard key={item.id} id={item.id} title={item.标题} thumbnail={referenceImageUrl(item.缩略图)} badges={legacy ? [item.发长, portraitHairFamily(item), portraitFringe(item)] : [c.age ? `${c.age} 岁` : c.ageBand, c.presentation, c.skinTone, c.bodyDesign, c.designRegion ?? '']} description={legacy ? item.分区 : c.appearance} selected={recipe.portrait?.id === item.id} onPreview={() => setViewer(item)} onToggle={() => select(item)} />
    })}</div>
    {!filtered.length && <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">没有匹配的人像，可调整或重置筛选。</div>}
    {shown < filtered.length && <Button variant="outline" className="mx-auto" onClick={() => setShown(shown + 24)}>再显示 24 张 · 剩余 {filtered.length - shown}</Button>}
    <LibraryImageDialog item={viewer ? { id: viewer.id, title: viewer.标题, url: referenceImageUrl(viewer.原图), description: '人物参考' } : null} onClose={() => setViewer(null)} onPrevious={() => move(-1)} onNext={() => move(1)}>
      {viewer && <><p className="text-sm leading-7">{portraitClassification(viewer).appearance}</p><dl className="space-y-2 text-xs leading-6"><div>发长：{viewer.发长 || '见人物档案'}</div><div>拍摄类型：{capture(viewer)}</div>{viewer.source && <><div>年龄设定：{portraitClassification(viewer).age ?? '见人物档案'}</div><div>性别形象：{portraitClassification(viewer).presentation}</div><div>体型设定：{portraitClassification(viewer).bodyDesign}</div><div>脸型设定：{portraitClassification(viewer).faceShape ?? '未标注'}</div><div>胡须设定：{portraitClassification(viewer).facialHair ?? '未标注'}</div><div>外观设计方向：{portraitClassification(viewer).designRegion ?? '未标注'}</div><div>创作定位：{portraitClassification(viewer).market}</div></>}</dl><Button onClick={() => select(viewer)}>{recipe.portrait?.id === viewer.id ? '从配方移除人像' : '加入人像参考'}</Button><Button variant="outline" asChild><Link to="/studio">继续搭配穿搭与人物设定</Link></Button></>}
    </LibraryImageDialog>
  </>
}
