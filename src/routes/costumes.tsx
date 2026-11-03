import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { costumesQuery, isNsfwCostume } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { LibrarySelect, LibraryTabs } from '@/components/library/LibraryControls'
import { LibraryImageCard } from '@/components/library/LibraryImageCard'
import { LibraryImageDialog } from '@/components/library/LibraryImageDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { costumeDescriptionGroups, costumeDescriptionKey, matchesCatalog } from '@/lib/catalog'
import { costumeClassification } from '@/lib/library'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useStudio } from '@/store/studioStore'
import type { CostumeItem } from '@/types/gallery'

export const Route = createFileRoute('/costumes')({ staticData: { title: '服装穿搭库' }, loader: ({ context }) => context.queryClient.ensureQueryData(costumesQuery), component: CostumesPage })
const emptyFilters = () => ({ cut: '', occasion: '', fit: '', season: '', stage: '', structure: '', category: '', tag: '', query: '' })

function CostumesPage() {
  const { data } = useSuspenseQuery(costumesQuery)
  const { recipe, toggleCostume, safeMode, requestUnlockNsfw } = useStudio()
  const [scope, setScope] = useState('expanded')
  const [filters, setFilters] = useState(emptyFilters)
  const [grouped, setGrouped] = useState(false)
  const [exactGroup, setExactGroup] = useState('')
  const [shown, setShown] = useState(24)
  const [viewer, setViewer] = useState<CostumeItem | null>(null)
  const added = data.filter((item) => item.source === 'catalog')
  const original = data.filter((item) => item.source !== 'catalog')
  const available = safeMode ? data.filter((item) => !isNsfwCostume(item)) : data
  const scoped = available.filter((item) => scope === 'all' || (scope === 'expanded' ? item.source === 'catalog' : item.source !== 'catalog'))
  const filtered = scoped.filter((item) => {
    const c = costumeClassification(item)
    return (!filters.cut || c.cut === filters.cut) && (!filters.occasion || c.occasion === filters.occasion) && (!filters.fit || c.fit === filters.fit) && (!filters.season || c.season === filters.season) && (!filters.stage || c.stage === filters.stage) && (!filters.structure || c.structure === filters.structure) && (!filters.category || item.分类 === filters.category) && (!filters.tag || item.标签.includes(filters.tag)) && (!exactGroup || costumeDescriptionKey(item) === exactGroup) && matchesCatalog(item.检索, filters.query)
  })
  const groups = costumeDescriptionGroups(filtered)
  const visible = grouped ? [...groups.values()].map((rows) => rows[0]) : filtered
  const viewerIndex = viewer ? visible.findIndex((item) => item.id === viewer.id) : -1
  function move(delta: number) { if (visible.length) setViewer(visible[(viewerIndex + delta + visible.length) % visible.length]) }
  function patch(key: keyof ReturnType<typeof emptyFilters>, value: string) { setFilters({ ...filters, [key]: value }); setExactGroup(''); setShown(24); setViewer(null) }
  function changeScope(value: string) { setScope(value); setFilters(emptyFilters()); setExactGroup(''); setGrouped(false); setShown(24); setViewer(null) }
  function reset() { setFilters(emptyFilters()); setExactGroup(''); setGrouped(false); setShown(24) }
  const classifications = scoped.map(costumeClassification)
  return <>
    <PageHeader title="服装穿搭库" description={`新增 ${added.length} 套男款、女款与中性穿搭，覆盖成熟日常、职业、运动、居家和户外。原库 ${original.length} 套保留季节与单品分类。`} actions={<Button size="sm" asChild><Link to="/studio">前往人物创作</Link></Button>} />
    <LibraryTabs value={scope} onChange={changeScope} options={[{ value: 'expanded', label: '新增多样穿搭', count: added.length }, { value: 'original', label: '原库季节与主题', count: original.length }, { value: 'all', label: '全部穿搭', count: data.length }]} />
    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
      <div className="flex flex-wrap gap-3"><Input aria-label="搜索穿搭" placeholder="款式、场景、颜色、材质或编号，可用空格组合关键词" className="min-w-48 flex-1" value={filters.query} onChange={(event) => patch('query', event.target.value)} /><Button variant="ghost" onClick={reset}>重置筛选</Button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {scope !== 'original' && <LibrarySelect label="版型定位" value={filters.cut} values={classifications.map((c) => c.cut)} onChange={(value) => patch('cut', value)} />}
        <LibrarySelect label="使用场景" value={filters.occasion} values={classifications.map((c) => c.occasion)} onChange={(value) => patch('occasion', value)} />
        {scope !== 'original' && <><LibrarySelect label="松量与体型" value={filters.fit} values={classifications.map((c) => c.fit)} onChange={(value) => patch('fit', value)} /><LibrarySelect label="生活风格" value={filters.stage} values={classifications.map((c) => c.stage)} onChange={(value) => patch('stage', value)} /></>}
        <LibrarySelect label="季节" value={filters.season} values={classifications.map((c) => c.season)} onChange={(value) => patch('season', value)} />
      </div>
      <details open={scope === 'original'}><summary className="cursor-pointer text-xs font-medium">单品结构、源库主题与细节标签</summary><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <LibrarySelect label="搭配结构" value={filters.structure} values={classifications.map((c) => c.structure)} onChange={(value) => patch('structure', value)} />
        <LibrarySelect label="源库分类" value={filters.category} values={scoped.map((item) => item.分类)} onChange={(value) => patch('category', value)} />
        <LibrarySelect label="单品与颜色标签" value={filters.tag} values={scoped.flatMap((item) => item.标签)} onChange={(value) => patch('tag', value)} />
      </div></details>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>{filtered.length} 套可选 · {groups.size} 种文字描述 · 版型为创作定位，穿着按人物身材适配</span><label className="flex items-center gap-2"><input type="checkbox" checked={grouped} onChange={(event) => { setGrouped(event.target.checked); setShown(24); setViewer(null) }} />按描述分组</label></div>
    {safeMode && scope !== 'expanded' && <p className="text-xs text-muted-foreground">安全模式隐藏 {data.length - available.length} 套敏感主题。<Button size="sm" variant="link" onClick={() => requestUnlockNsfw(() => {})}>查看完整分类设置</Button></p>}
    {exactGroup && <div className="flex items-center gap-3 text-xs"><span>仅显示同一描述的变体</span><Button size="sm" variant="ghost" onClick={() => { setExactGroup(''); setShown(24) }}>返回全部结果</Button></div>}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{visible.slice(0, shown).map((item) => {
      const c = costumeClassification(item)
      const count = groups.get(costumeDescriptionKey(item))?.length ?? 1
      return <div key={item.id} className="min-w-0"><LibraryImageCard id={item.id} title={item.服装名称} thumbnail={referenceImageUrl(item.缩略图)} source={item.source === 'catalog' ? '新增原创' : '原库'} badges={item.source === 'catalog' ? [c.cut, c.occasion, c.fit, c.stage] : [item.分类, c.structure, ...item.标签.slice(0, 2)]} contain selected={recipe.costume?.id === item.id} onPreview={() => setViewer(item)} onToggle={() => toggleCostume(item)} />{count > 1 && <button type="button" className="mt-2 px-2 text-xs text-muted-foreground underline underline-offset-2" onClick={() => { setExactGroup(costumeDescriptionKey(item)); setGrouped(false); setShown(24) }}>查看同描述 {count} 套</button>}</div>
    })}</div>
    {!visible.length && <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">没有匹配的穿搭。<Button variant="link" onClick={reset}>重置筛选</Button></div>}
    {shown < visible.length && <Button variant="outline" className="mx-auto" onClick={() => setShown(shown + 24)}>再显示 24 套 · 剩余 {visible.length - shown}</Button>}
    <LibraryImageDialog item={viewer ? { id: viewer.id, title: viewer.服装名称, url: referenceImageUrl(viewer.原图), description: viewer.source === 'catalog' ? '项目原创服装设计 · 服装与人物身份分别控制' : '原库服装参考' } : null} onClose={() => setViewer(null)} onPrevious={() => move(-1)} onNext={() => move(1)}>
      {viewer && <><dl className="space-y-2 text-xs leading-7">{Object.entries({ '版型定位': costumeClassification(viewer).cut, '使用场景': costumeClassification(viewer).occasion, '松量与体型': costumeClassification(viewer).fit, '生活风格': costumeClassification(viewer).stage, '季节': costumeClassification(viewer).season, '搭配结构': costumeClassification(viewer).structure }).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl><p className="text-xs leading-6 text-muted-foreground">仅选服装与搭配，人物的五官、肤色和体型由人像与角色母版控制。</p><Button onClick={() => toggleCostume(viewer)}>{recipe.costume?.id === viewer.id ? '从配方移除穿搭' : '加入服装参考'}</Button><Button variant="outline" asChild><Link to="/studio">继续搭配人物与状态</Link></Button></>}
    </LibraryImageDialog>
  </>
}
