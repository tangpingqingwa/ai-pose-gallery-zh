import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { portraitsQuery } from '@/api/gallery'
import ranking from '../../data/portrait-meta-zh.json'
import expansion from '../../data/catalog-expansion.json'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LibrarySelect, LibraryTabs } from '@/components/library/LibraryControls'
import { LibraryImageCard } from '@/components/library/LibraryImageCard'
import { LibraryImageDialog } from '@/components/library/LibraryImageDialog'
import { matchesCatalog } from '@/lib/catalog'
import { portraitFor } from '@/lib/characters'
import { portraitClassification, portraitFringe, portraitHairFamily } from '@/lib/library'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useCharacterLibrary } from '@/store/characterStore'
import { useStudio } from '@/store/studioStore'
import type { PortraitItem } from '@/types/gallery'

export const Route = createFileRoute('/portraits')({ staticData: { title: '人像参考库' }, loader: ({ context }) => context.queryClient.ensureQueryData(portraitsQuery), component: PortraitsPage })

const emptyFilters = () => ({ age: '', presentation: '', skin: '', body: '', market: '', hair: '', family: '', fringe: '', section: '', query: '' })

function PortraitsPage() {
  const { data } = useSuspenseQuery(portraitsQuery)
  const { profiles } = useCharacterLibrary()
  const { recipe, togglePortrait, setCharacter, setPortrait } = useStudio()
  const own = useMemo(() => profiles.map((profile) => portraitFor(profile, expansion.seedPreviews)).filter((item): item is PortraitItem => Boolean(item)), [profiles])
  const added = data.filter((item) => item.source === 'catalog')
  const original = data.filter((item) => item.source !== 'catalog')
  const all = [...added, ...own, ...original]
  const [scope, setScope] = useState('expanded')
  const [filters, setFilters] = useState(emptyFilters)
  const [onlyRanked, setOnlyRanked] = useState(false)
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [shown, setShown] = useState(24)
  const [viewer, setViewer] = useState<PortraitItem | null>(null)
  const scoped = scope === 'expanded' ? [...added, ...own] : scope === 'original' ? original : scope === 'character' ? own : all
  const rankIds = new Set(ranking.排行榜Top10[(filters.hair || '综合') as keyof typeof ranking.排行榜Top10] ?? [])
  const filtered = scoped.filter((item) => {
    const c = portraitClassification(item)
    return (!filters.age || c.ageBand === filters.age) && (!filters.presentation || c.presentation === filters.presentation) && (!filters.skin || c.skinTone === filters.skin) && (!filters.body || c.bodyDesign === filters.body) && (!filters.market || c.market.includes(filters.market)) && (!filters.hair || item.发长 === filters.hair) && (!filters.family || portraitHairFamily(item) === filters.family) && (!filters.fringe || portraitFringe(item) === filters.fringe) && (!filters.section || item.分区 === filters.section) && (!onlyRanked || rankIds.has(item.id)) && (!onlyFeatured || item.精选) && matchesCatalog([item.检索, c.appearance, c.ageBand, c.presentation, c.market, c.bodyDesign].join(' '), filters.query)
  })
  function patch(key: keyof ReturnType<typeof emptyFilters>, value: string) { setFilters({ ...filters, [key]: value }); setShown(24); setViewer(null) }
  function changeScope(value: string) { setScope(value); setFilters(emptyFilters()); setOnlyRanked(false); setOnlyFeatured(false); setShown(24); setViewer(null) }
  function select(item: PortraitItem) {
    const profile = item.source === 'character' ? profiles.find((p) => `character:${p.id}` === item.id) : undefined
    if (profile) { if (recipe.character?.id === profile.id) setPortrait(null); else setCharacter(profile) }
    else togglePortrait(item)
  }
  const viewerIndex = viewer ? filtered.findIndex((item) => item.id === viewer.id) : -1
  function move(delta: number) { if (filtered.length) setViewer(filtered[(viewerIndex + delta + filtered.length) % filtered.length]) }
  const personalFilters = scope !== 'original'
  return <>
    <PageHeader title="人像参考库" description={`新增 ${added.length} 张不同年龄与形象的原创人像，另有 ${own.length} 位自有角色母版。原库 ${original.length} 张按发型与正脸/氛围分组。`} actions={<Button size="sm" asChild><Link to="/studio">前往人物创作</Link></Button>} />
    <LibraryTabs value={scope} onChange={changeScope} options={[{ value: 'expanded', label: '新增与自有人像', count: added.length + own.length }, { value: 'original', label: '原库发型与氛围', count: original.length }, { value: 'character', label: '自有 IP', count: own.length }, { value: 'all', label: '全部人像', count: all.length }]} />
    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
      <div className="flex flex-wrap gap-3"><Input aria-label="搜索人像" placeholder="人物、年龄、外貌、发型或编号，可用空格组合关键词" className="min-w-48 flex-1" value={filters.query} onChange={(event) => patch('query', event.target.value)} /><Button variant="ghost" onClick={() => { setFilters(emptyFilters()); setOnlyRanked(false); setOnlyFeatured(false); setShown(24) }}>重置筛选</Button></div>
      {personalFilters && <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <LibrarySelect label="年龄设定" value={filters.age} values={['18–29', '30–44', '45–59', '60+', ...(scope === 'all' ? ['原库未标注'] : [])]} onChange={(value) => patch('age', value)} />
        <LibrarySelect label="性别形象" value={filters.presentation} values={scoped.map((item) => portraitClassification(item).presentation)} onChange={(value) => patch('presentation', value)} />
        <LibrarySelect label="肤色设定" value={filters.skin} values={scoped.map((item) => portraitClassification(item).skinTone)} onChange={(value) => patch('skin', value)} />
        <LibrarySelect label="体型设定" value={filters.body} values={scoped.map((item) => portraitClassification(item).bodyDesign)} onChange={(value) => patch('body', value)} />
        <LibrarySelect label="创作定位" value={filters.market} values={['欧洲', '北美']} onChange={(value) => patch('market', value)} />
      </div>}
      <details open={scope === 'original'}><summary className="cursor-pointer text-xs font-medium">发型与拍摄分类</summary><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LibrarySelect label="发长" value={filters.hair} values={['短发', '中发', '中长发', '长发']} onChange={(value) => patch('hair', value)} />
        <LibrarySelect label="发型家族" value={filters.family} values={scoped.map(portraitHairFamily)} onChange={(value) => patch('family', value)} />
        <LibrarySelect label="刘海" value={filters.fringe} values={scoped.map(portraitFringe)} onChange={(value) => patch('fringe', value)} />
        <LibrarySelect label="拍摄分区" value={filters.section} values={scoped.map((item) => item.分区)} onChange={(value) => patch('section', value)} />
      </div></details>
      {scope === 'original' && <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant={onlyRanked ? 'secondary' : 'outline'} onClick={() => { setOnlyRanked(!onlyRanked); setShown(24) }}>原库{filters.hair || '综合'} Top10</Button><Button size="sm" variant={onlyFeatured ? 'secondary' : 'outline'} onClick={() => { setOnlyFeatured(!onlyFeatured); setShown(24) }}>原库精选</Button><span className="text-xs text-muted-foreground">年龄、性别与地域未在原始数据记录，原库按已知标签分类。</span></div>}
    </div>
    <p className="text-xs text-muted-foreground">{filtered.length} 张可选图片 · 新增标签来自创作设定 · 可直接加入配方</p>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{filtered.slice(0, shown).map((item) => {
      const c = portraitClassification(item)
      const legacy = c.collection === 'original'
      return <LibraryImageCard key={item.id} id={item.id} title={item.标题} thumbnail={referenceImageUrl(item.缩略图)} source={item.source === 'character' ? '自有 IP' : legacy ? '原库' : '新增原创'} badges={legacy ? [item.发长, portraitHairFamily(item), portraitFringe(item)] : [c.age ? `${c.age} 岁` : c.ageBand, c.presentation, c.skinTone, c.bodyDesign]} description={legacy ? item.分区 : c.appearance} selected={recipe.portrait?.id === item.id} onPreview={() => setViewer(item)} onToggle={() => select(item)} />
    })}</div>
    {!filtered.length && <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">没有匹配的人像。可重置筛选或切换素材集。</div>}
    {shown < filtered.length && <Button variant="outline" className="mx-auto" onClick={() => setShown(shown + 24)}>再显示 24 张 · 剩余 {filtered.length - shown}</Button>}
    <LibraryImageDialog item={viewer ? { id: viewer.id, title: viewer.标题, url: referenceImageUrl(viewer.原图), description: viewer.source === 'catalog' ? '项目原创虚构成年人 · 设定可核对' : viewer.source === 'character' ? '自有角色母版' : '原库发型/氛围参考' } : null} onClose={() => setViewer(null)} onPrevious={() => move(-1)} onNext={() => move(1)}>
      {viewer && <><p className="text-sm leading-7">{portraitClassification(viewer).appearance}</p><dl className="space-y-2 text-xs leading-6"><div>发长：{viewer.发长 || '见人物档案'}</div><div>分区：{viewer.分区}</div>{viewer.source && <><div>年龄设定：{portraitClassification(viewer).age ?? '见人物档案'}</div><div>性别形象：{portraitClassification(viewer).presentation}</div><div>体型设定：{portraitClassification(viewer).bodyDesign}</div><div>创作定位：{portraitClassification(viewer).market}</div></>}</dl><Button onClick={() => select(viewer)}>{recipe.portrait?.id === viewer.id ? '从配方移除人像' : '加入人像参考'}</Button><Button variant="outline" asChild><Link to="/studio">继续搭配表情、妆发与细节</Link></Button></>}
    </LibraryImageDialog>
  </>
}
