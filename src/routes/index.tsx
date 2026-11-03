import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRightIcon, LayersIcon, ShirtIcon, UserRoundIcon, SparklesIcon } from 'lucide-react'
import expansion from '../../data/catalog-expansion.json'
import demo from '../../data/library-demo-task.json'
import { costumesQuery, portraitsQuery, posesQuery, visualReferencesQuery } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { downloadJson, portraitFor } from '@/lib/characters'
import { REFERENCE_LIBRARIES } from '@/lib/library'
import { characterVisualReferences } from '@/lib/visualReferences'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useCharacterLibrary } from '@/store/characterStore'
import type { PortraitItem } from '@/types/gallery'

export const Route = createFileRoute('/')({ staticData: { title: '图库总览' }, loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(posesQuery), context.queryClient.ensureQueryData(costumesQuery), context.queryClient.ensureQueryData(portraitsQuery), context.queryClient.ensureQueryData(visualReferencesQuery)]), component: DashboardPage })

function DashboardPage() {
  const { data: poses } = useSuspenseQuery(posesQuery)
  const { data: costumes } = useSuspenseQuery(costumesQuery)
  const { data: portraits } = useSuspenseQuery(portraitsQuery)
  const { data: generatedRefs } = useSuspenseQuery(visualReferencesQuery)
  const { profiles } = useCharacterLibrary()
  const own = profiles.map((profile) => portraitFor(profile, expansion.seedPreviews)).filter((item): item is PortraitItem => Boolean(item))
  const references = [...generatedRefs, ...characterVisualReferences(profiles, expansion.seedPreviews)]
  const addedPortraits = portraits.filter((item) => item.source === 'catalog')
  const addedCostumes = costumes.filter((item) => item.source === 'catalog')
  const portraitCount = portraits.length + own.length
  const originalPortraitCount = portraits.length - addedPortraits.length
  const originalCostumeCount = costumes.length - addedCostumes.length
  const newImageCount = expansion.portraits.length + expansion.costumes.length + expansion.references.length
  const tiles = [
    { title: '人像参考库', to: '/portraits' as const, count: portraitCount, caption: `${addedPortraits.length} 张新增 · ${own.length} 张自有 · ${originalPortraitCount} 张原库`, images: addedPortraits.slice(0, 4).map((item) => ({ url: item.缩略图, title: item.标题 })) },
    { title: '服装穿搭库', to: '/costumes' as const, count: costumes.length, caption: `${addedCostumes.length} 套新增 · ${originalCostumeCount} 套原库`, images: addedCostumes.slice(0, 4).map((item) => ({ url: item.缩略图, title: item.服装名称 })) },
    { title: '动作姿势库', to: '/poses' as const, count: poses.items.length, caption: `${poses.groups.length} 组 · 白模与深度`, images: poses.groups.slice(0, 4).map((group) => ({ url: group.order[0].缩略图, title: group.name })) },
    ...Object.entries(REFERENCE_LIBRARIES).map(([kind, config]) => ({ title: config.title, to: config.route, count: references.filter((item) => item.kind === kind).length, caption: config.description, images: references.filter((item) => item.kind === kind).slice(0, 4).map((item) => ({ url: item.thumbnail, title: item.title })) })),
  ]
  return <>
    <PageHeader title="人物素材与创作" description="从七类图片素材自由组合：先确定人像，再选择穿搭、动作、表情、妆发、体型细节与习惯仪态。" actions={<Button asChild><Link to="/studio"><SparklesIcon className="size-4" />打开人物创作</Link></Button>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard title="素材类别" value="7 类" icon={<LayersIcon />} desc="所有类别均有可选图片" />
      <StatCard title="本批新增原创" value={`${newImageCount} 张`} icon={<SparklesIcon />} desc="16 人像 · 16 穿搭 · 12 状态细节" />
      <StatCard title="人像参考" value={`${portraitCount.toLocaleString('zh-CN')} 张`} icon={<UserRoundIcon />} desc="新增、自有与原库分别浏览" />
      <StatCard title="穿搭参考" value={`${costumes.length.toLocaleString('zh-CN')} 套`} icon={<ShirtIcon />} desc="男款、女款、中性与生活场景" />
    </div>
    <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">七类素材库</h2><p className="mt-1 text-xs text-muted-foreground">新增素材优先展示，原库按来源和已有信息独立分类。</p></div><Button variant="ghost" size="sm" asChild><Link to="/library-quality">查看整理记录<ArrowRightIcon className="size-3.5" /></Link></Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tiles.map((tile) => <Link key={tile.to} to={tile.to} className="group min-w-0 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"><div className="flex items-center justify-between"><h3 className="font-semibold">{tile.title}</h3><span className="text-xs text-muted-foreground">{tile.count.toLocaleString('zh-CN')}</span></div><div className="mt-3 grid grid-cols-4 gap-1.5">{tile.images.map((image) => <img key={image.url} src={referenceImageUrl(image.url)} alt={image.title} loading="lazy" className="aspect-[3/4] w-full rounded bg-muted object-cover object-top transition-transform group-hover:scale-[1.015]" />)}</div><p className="mt-3 text-xs leading-6 text-muted-foreground">{tile.caption}</p></Link>)}</div>
    </section>
    <section className="grid gap-5 rounded-xl border p-4 sm:grid-cols-[180px_1fr] sm:p-5"><a href={demo.result.url} target="_blank" rel="noreferrer" aria-label="查看 Nadia 七库合成原图"><img src={demo.result.thumbnail} alt="七类参考合成的 Nadia：森林绿外套、丰盈体型、解释时的神态与开放手势" loading="lazy" className="mx-auto max-h-72 rounded-lg object-contain" /></a><div className="space-y-3 self-center"><h2 className="text-lg font-semibold">七类参考，一位完整的人物</h2><p className="max-w-2xl text-sm leading-7 text-muted-foreground">Nadia 的人像身份，配合成熟通勤穿搭、站立姿势、解释时的神态、日常妆发、丰盈体型与开放手势。这张成片已通过 Codex 内置生图实际生成，七张参考分别控制各自的部分。</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadJson(demo, 'nadia-seven-library-example.json')}>下载示例任务</Button><Button variant="outline" asChild><a href={demo.result.url} download="nadia-seven-libraries.png">下载成片原图</a></Button><Button asChild><Link to="/studio">打开人物创作</Link></Button></div></div></section>
    <section className="rounded-xl bg-muted/50 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">新增人像：先看到不同的人</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">不同年龄段、男性、女性、中性形象、肤色与体型设定分别可筛选。</p></div><Button size="sm" variant="outline" asChild><Link to="/portraits">选择人像参考<ArrowRightIcon className="size-3.5" /></Link></Button></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{addedPortraits.slice(0, 6).map((item) => <Link key={item.id} to="/portraits" className="min-w-0"><img src={referenceImageUrl(item.缩略图)} alt={item.标题} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover object-top" /><p className="mt-2 truncate text-xs">{item.标题}</p></Link>)}</div></section>
    <p className="text-xs leading-6 text-muted-foreground">新增图片为项目原创虚构素材，设定与生成记录单独保存。原库保留原有来源说明。图库可直接组成生图任务，也可与自有 IP 档案关联。</p>
  </>
}
