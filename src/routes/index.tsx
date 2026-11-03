import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRightIcon, LayersIcon, NotebookPenIcon, ShirtIcon, UserRoundIcon, SparklesIcon } from 'lucide-react'
import expansion from '../../data/catalog-expansion.json'
import { costumesQuery, portraitsQuery, posesQuery, visualReferencesQuery } from '@/api/gallery'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Button } from '@/components/ui/button'
import { portraitFor } from '@/lib/characters'
import { REFERENCE_LIBRARIES } from '@/lib/library'
import { SETTING_CATEGORIES } from '@/lib/settingLibrary'
import { referenceImageUrl } from '@/lib/recipeImages'
import { useCharacterLibrary } from '@/store/characterStore'
import { useSettingLibrary } from '@/store/settingStore'
import type { PortraitItem } from '@/types/gallery'

export const Route = createFileRoute('/')({ staticData: { title: '素材总览' }, loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(posesQuery), context.queryClient.ensureQueryData(costumesQuery), context.queryClient.ensureQueryData(portraitsQuery), context.queryClient.ensureQueryData(visualReferencesQuery)]), component: DashboardPage })

function DashboardPage() {
  const { data: poses } = useSuspenseQuery(posesQuery)
  const { data: costumes } = useSuspenseQuery(costumesQuery)
  const { data: portraits } = useSuspenseQuery(portraitsQuery)
  const { data: references } = useSuspenseQuery(visualReferencesQuery)
  const { profiles } = useCharacterLibrary()
  const { records } = useSettingLibrary()
  const own = profiles.map((profile) => portraitFor(profile, expansion.seedPreviews)).filter((item): item is PortraitItem => Boolean(item))
  const portraitCount = portraits.length + own.length
  const tiles = [
    { title: '人像参考库', to: '/portraits' as const, count: portraitCount, caption: '五官身份、年龄、肤色、体型与发型。', images: portraits.slice(0, 4).map((item) => ({ url: item.缩略图, title: item.标题 })) },
    { title: '服装穿搭库', to: '/costumes' as const, count: costumes.length, caption: '版型、用途、季节、松量与单品结构。', images: costumes.slice(0, 4).map((item) => ({ url: item.缩略图, title: item.服装名称 })) },
    { title: '动作姿势库', to: '/poses' as const, count: poses.items.length, caption: '整体动作、镜头视角、素体与深度。', images: poses.groups.slice(0, 4).map((group) => ({ url: group.order[0].缩略图, title: group.name })) },
    ...Object.entries(REFERENCE_LIBRARIES).map(([kind, config]) => ({ title: config.title, to: config.route, count: references.filter((item) => item.kind === kind).length, caption: config.description, images: references.filter((item) => item.kind === kind).slice(0, 4).map((item) => ({ url: item.thumbnail, title: item.title })) })),
  ]
  return <>
    <PageHeader title="人物素材与创作" description="图像素材控制外形与状态，设定记录丰富生活和表达。指定关联，或锁定重要项后随机组合。" actions={<Button asChild><Link to="/studio"><SparklesIcon className="size-4" />进入创作台</Link></Button>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard title="素材库" value="9 类" icon={<LayersIcon />} desc="7 类图像 · 2 类设定记录" /><StatCard title="设定记录" value={`${records.length} 条`} icon={<NotebookPenIcon />} desc="个性生活、语言口音与声音" /><StatCard title="人像参考" value={`${portraitCount.toLocaleString('zh-CN')} 张`} icon={<UserRoundIcon />} desc="按年龄、形象与发型筛选" /><StatCard title="穿搭参考" value={`${costumes.length.toLocaleString('zh-CN')} 套`} icon={<ShirtIcon />} desc="版型、用途与日常适配" /></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tiles.map((tile) => <Link key={tile.to} to={tile.to} className="group min-w-0 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">{tile.title}</h2><span className="text-xs text-muted-foreground">{tile.count.toLocaleString('zh-CN')}</span></div><div className="mt-3 grid grid-cols-4 gap-1.5">{tile.images.map((image) => <img key={image.url} src={referenceImageUrl(image.url)} alt={image.title} loading="lazy" className="aspect-[3/4] w-full rounded bg-muted object-contain object-top transition-transform group-hover:scale-[1.015] motion-reduce:transform-none" />)}</div><p className="mt-3 text-xs leading-6 text-muted-foreground">{tile.caption}</p></Link>)}{(['life', 'voice'] as const).map((group) => {
      const available = records.filter((record) => SETTING_CATEGORIES[record.category].group === group)
      return <Link key={group} to={group === 'life' ? '/traits' : '/voices'} className="group rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">{group === 'life' ? '个性与生活库' : '语言与声音库'}</h2><span className="text-xs text-muted-foreground">{available.length} 条</span></div><div className="mt-4 flex flex-wrap gap-2">{Object.values(SETTING_CATEGORIES).filter((category) => category.group === group).map((category) => <span key={category.label} className="rounded-md bg-muted px-2 py-1 text-xs leading-6">{category.label}</span>)}</div><p className="mt-4 text-xs leading-6 text-muted-foreground">{group === 'life' ? '职业、经历、喜好与习惯分别记录，组合为有连续性的个人。' : '语言口音与声线独立选择，保留自然节奏与稳定表达。'}</p></Link>
    })}</div>
    <section className="rounded-xl bg-muted/50 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">选择人物身份</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">表情、妆发、体型与仪态使用通用白模，生成时保留人物自身的五官和材质。</p></div><Button variant="outline" size="sm" asChild><Link to="/portraits">浏览人像<ArrowRightIcon className="size-3.5" /></Link></Button></div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{portraits.slice(0, 6).map((item) => <Link key={item.id} to="/portraits" className="min-w-0"><img src={referenceImageUrl(item.缩略图)} alt={item.标题} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover object-top" /><p className="mt-2 truncate text-xs">{item.标题}</p></Link>)}</div></section>
  </>
}
