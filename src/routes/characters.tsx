import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, CopyIcon, DownloadIcon, ImagePlusIcon, PencilIcon, PlusIcon, SearchIcon, SparklesIcon, UploadIcon, UserRoundIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { CharacterEditor } from '@/components/characters/CharacterEditor'
import { CharacterLooks } from '@/components/characters/CharacterLooks'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ASSET_KINDS, assetFor, characterTaskPrompt, downloadJson } from '@/lib/characters'
import { cn } from '@/lib/utils'
import { fileToDataUrl } from '@/services/aiGenerator'
import { useCharacterLibrary } from '@/store/characterStore'
import { useStudio } from '@/store/studioStore'
import type { CharacterAsset, CharacterAssetKind, CharacterProfile } from '@/types/character'

export const Route = createFileRoute('/characters')({
  staticData: { title: '自有 IP 角色库' },
  validateSearch: (search: Record<string, unknown>) => ({ id: typeof search.id === 'string' ? search.id : undefined }),
  component: CharactersPage,
})

function CharactersPage() {
  const { profiles, hydrated, storageError, saveProfile, importProfiles } = useCharacterLibrary()
  const { id } = Route.useSearch()
  const navigate = useNavigate({ from: '/characters' })
  const [query, setQuery] = useState('')
  const [gender, setGender] = useState('全部')
  const [editor, setEditor] = useState<CharacterProfile | 'new' | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const selected = profiles.find((profile) => profile.id === id)
  const filtered = profiles.filter((profile) => (gender === '全部' || profile.gender === gender) && `${profile.name} ${profile.displayName} ${profile.tagline} ${profile.persona.topics.join(' ')} ${profile.appearance.bodyType} ${profile.baseCity}`.toLowerCase().includes(query.trim().toLowerCase()))
  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      if (file.size > 20 * 1024 * 1024) throw new Error('单次档案导入请小于 20 MB')
      const count = importProfiles(JSON.parse(await file.text()))
      toast.success(`已导入 ${count} 个角色档案`)
    } catch (error) { toast.error(error instanceof Error ? error.message : '档案导入失败') }
    finally { event.target.value = '' }
  }
  function persist(profile: CharacterProfile) {
    saveProfile(profile)
    toast.success('角色档案已更新')
    void navigate({ search: { id: profile.id } })
  }
  return <>
    {storageError && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">本机存储暂不可用。请导出档案备份本次修改。</p>}
    {selected ? <CharacterDetail key={selected.id} profile={selected} onBack={() => void navigate({ search: { id: undefined } })} onEdit={() => setEditor(selected)} /> : <>
      <PageHeader title="自有 IP 角色库" description="把面孔、体型与人设关联成可以持续创作的角色。" actions={<Button disabled={!hydrated} onClick={() => setEditor('new')}><PlusIcon className="size-4" />建立角色</Button>} />
      {id && <p role="status" className="text-sm text-muted-foreground">未找到该角色，你可以导入档案或选择其他角色。</p>}
      <div className="flex flex-wrap items-center gap-3 border-b pb-4">
        <div className="relative min-w-44 flex-1 sm:max-w-sm"><SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="搜索角色" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名字、特征、体型或话题" className="pl-9" /></div>
        <div className="flex gap-1" aria-label="性别筛选">{['全部', ...new Set(profiles.map((profile) => profile.gender))].map((item) => <Button key={item} size="sm" variant={gender === item ? 'secondary' : 'ghost'} aria-pressed={gender === item} onClick={() => setGender(item)}>{item}</Button>)}</div>
        <div className="ml-auto flex gap-1"><Button variant="ghost" size="sm" disabled={!hydrated} onClick={() => importRef.current?.click()}><UploadIcon className="size-3.5" />导入</Button><Button variant="ghost" size="sm" onClick={() => downloadJson(profiles, 'ip-library.json')}><DownloadIcon className="size-3.5" />导出档案</Button></div>
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{filtered.length} 位角色 · 地点与身材均为创作设定</span><span>本机修改可导出备份</span></div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:gap-x-6">
        {filtered.map((profile) => {
          const portrait = assetFor(profile, 'lifestyle') ?? assetFor(profile, 'portrait')
          const categories = new Set(profile.assets.map((asset) => asset.kind))
          return <button type="button" key={profile.id} onClick={() => void navigate({ search: { id: profile.id } })} className="character-card group min-w-0 rounded-xl text-left outline-offset-4 focus-visible:outline-2" aria-label={`查看 ${profile.name} 角色档案`}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
              {portrait ? <img src={portrait.url} alt={`${profile.name} 的角色形象`} className="size-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none" loading="lazy" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"><UserRoundIcon className="size-12" /><span className="text-sm">待添加母版</span></div>}
              <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-2 py-1 text-[11px] text-white">{profile.assets.length} 项资产</span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{profile.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">{profile.displayName} · {profile.age} 岁 · {profile.baseCity || '地点待设定'}</p></div><ArrowUpRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
            <p className="mt-2 line-clamp-2 text-sm leading-6">{profile.tagline || '补充这位角色的独特外貌与故事。'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="secondary">{profile.appearance.bodyType}</Badge><Badge variant="outline">{profile.body.heightCm} cm</Badge><span className="ml-auto self-center text-[11px] text-muted-foreground">{[ 'portrait', 'turnaround', 'expressions' ].filter((kind) => categories.has(kind as CharacterAssetKind)).length}/3 类参考</span></div>
          </button>
        })}
      </div>
      {!filtered.length && <div className="flex flex-col items-center gap-3 py-16 text-center"><UserRoundIcon className="size-9 text-muted-foreground" /><p className="text-sm">没有匹配的角色</p><Button variant="outline" onClick={() => { setQuery(''); setGender('全部') }}>清除筛选</Button></div>}
    </>}
    {editor && <CharacterEditor key={editor === 'new' ? 'new' : editor.id} initial={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSave={persist} />}
  </>
}

function CharacterDetail({ profile, onBack, onEdit }: { profile: CharacterProfile; onBack: () => void; onEdit: () => void }) {
  const { setCharacter, setCharacterTask } = useStudio()
  const { addAsset, reviewAsset, hydrated } = useCharacterLibrary()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'profile' | 'assets' | 'create'>('profile')
  const [kind, setKind] = useState<CharacterAssetKind>('portrait')
  const [zoom, setZoom] = useState<CharacterAsset | null>(null)
  const [uploading, setUploading] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  const portrait = assetFor(profile, 'portrait')
  const body = profile.body
  const appearance = profile.appearance
  async function uploadAsset(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('请使用小于 10 MB 的 PNG、JPEG 或 WebP 图片')
      const url = await fileToDataUrl(file)
      const image = new Image()
      image.src = url
      await image.decode()
      const parent = kind === 'portrait' ? [] : portrait ? [portrait.id] : []
      addAsset(profile.id, { id: crypto.randomUUID(), kind, title: `${ASSET_KINDS[kind].label} · ${file.name}`, url, parentAssetIds: parent, createdAt: new Date(file.lastModified).toISOString(), generator: '用户收录', prompt: characterTaskPrompt(profile, kind), review: 'unreviewed', width: image.width, height: image.height })
      toast.success('图片已收录，检查身份一致性后可标记验收')
    } catch (error) { toast.error(error instanceof Error ? error.message : '图片收录失败') }
    finally { setUploading(false); event.target.value = '' }
  }
  function sendToStudio(task: CharacterAssetKind = 'lifestyle') {
    try { setCharacter(profile); setCharacterTask(task); void navigate({ to: '/studio' }) } catch (error) { toast.error(error instanceof Error ? error.message : '请先添加正脸母版') }
  }
  async function copyTask(task: CharacterAssetKind) {
    try {
      const refs = [portrait, ...(task === 'lifestyle' ? [assetFor(profile, 'turnaround')] : [])].filter(Boolean) as CharacterAsset[]
      await navigator.clipboard.writeText(['请使用 Codex 内置生图完成下列角色任务。', '按顺序附上参考图片：', ...refs.map((asset, i) => `${i + 1}. ${asset.title}：${asset.url}`), '', characterTaskPrompt(profile, task)].join('\n'))
      toast.success('已复制任务；在 Codex 附上所列参考图后生成')
    } catch { toast.error('复制失败，请使用导出任务') }
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" size="sm" onClick={onBack}><ArrowLeftIcon className="size-4" />全部角色</Button><div className="flex gap-1"><Button variant="ghost" size="sm" disabled={!hydrated} onClick={onEdit}><PencilIcon className="size-3.5" />编辑档案</Button><Button variant="ghost" size="sm" onClick={() => downloadJson(profile, `${profile.slug}-profile.json`)}><DownloadIcon className="size-3.5" />导出</Button></div></div>
    <div className="grid gap-6 md:grid-cols-[minmax(200px,0.75fr)_1.5fr] lg:gap-9">
      <div className="overflow-hidden rounded-xl bg-muted"><div className="aspect-[4/5]">{portrait ? <button className="size-full cursor-zoom-in" onClick={() => setZoom(portrait)} aria-label="放大正脸母版"><img src={portrait.url} alt={`${profile.name} 正脸母版`} className="size-full object-cover object-top" /></button> : <div className="flex h-full items-center justify-center"><ImagePlusIcon className="size-12 text-muted-foreground" /></div>}</div></div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="font-mono text-xs text-muted-foreground">{profile.id} · v{profile.version} · 原创虚构角色</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{profile.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{profile.displayName} · {profile.age} 岁 · {profile.gender} · {profile.baseCity || '地点待设定'}</p>
        <p className="mt-5 text-lg leading-7">{profile.tagline || '为角色补充独特的外貌特征。'}</p>
        <p className="mt-3 max-w-prose text-sm leading-7 text-muted-foreground">{profile.persona.bio || '角色故事待完善。'}</p>
        <div className="mt-4 flex flex-wrap gap-2">{profile.persona.topics.map((topic) => <Badge key={topic} variant="secondary">{topic}</Badge>)}</div>
        <div className="mt-6"><Button onClick={() => sendToStudio()} disabled={!portrait}><SparklesIcon className="size-4" />带入角色合成台</Button><p className="mt-2 text-xs text-muted-foreground">关联固定五官、体型设计和母版参考。</p></div>
      </div>
    </div>
    <div className="mt-2 flex gap-5 border-b" role="tablist" aria-label="角色档案内容">{(['profile', 'assets', 'create'] as const).map((value) => <button type="button" key={value} role="tab" aria-selected={tab === value} aria-controls="character-panel" onClick={() => setTab(value)} className={cn('border-b-2 px-1 py-3 text-sm transition-colors', tab === value ? 'border-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground')}>{value === 'profile' ? '角色设定' : value === 'assets' ? `关联资产 (${profile.assets.length})` : '继续创作'}</button>)}</div>
    <div key={tab} id="character-panel" role="tabpanel" className="character-panel">
      {tab === 'profile' && <div className="grid gap-7 md:grid-cols-2">
        <section><h2 className="text-base font-semibold">固定外貌</h2><dl className="mt-4 space-y-3 text-sm">{Object.entries({ '脸型': appearance.face, '眼睛': appearance.eyes, '鼻子': appearance.nose, '嘴唇': appearance.lips, '眉形': appearance.brows, '肤色': appearance.skin, '头发': appearance.hair }).map(([key, value]) => <div className="grid grid-cols-[3rem_1fr] gap-3" key={key}><dt className="text-muted-foreground">{key}</dt><dd className="leading-6">{value || '待设定'}</dd></div>)}</dl><div className="mt-5 flex flex-wrap gap-2">{appearance.marks.map((mark) => <Badge variant="outline" key={mark}>{mark}</Badge>)}</div></section>
        <section><div className="flex items-center gap-2"><h2 className="text-base font-semibold">身材与形象</h2><Badge variant="secondary">设计目标</Badge></div><p className="mt-2 text-xs leading-6 text-muted-foreground">数字用于创作约束，图片需另行验收比例与体型。</p><dl className="mt-3 grid grid-cols-2 gap-x-5 text-sm">{Object.entries({ '体型': appearance.bodyType, '身高': `${body.heightCm} cm`, '体重': `${body.weightKg} kg`, '肩宽': `${body.shoulderCm} cm`, '胸围': `${body.chestCm} cm`, '腰围': `${body.waistCm} cm`, '臀围': `${body.hipsCm} cm`, '内侧腿长': `${body.inseamCm} cm` }).map(([key, value]) => <div className="flex justify-between gap-2 border-b py-3" key={key}><dt className="text-muted-foreground">{key}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}</dl><p className="mt-5 text-sm leading-7"><span className="text-muted-foreground">标志穿搭　</span>{profile.style.signatureOutfit || '待设定'}</p><p className="mt-3 text-sm leading-7"><span className="text-muted-foreground">声音设定　</span>{profile.persona.voice || '待设定'}</p></section>
      </div>}
      {tab === 'assets' && <>
        <CharacterLooks profile={profile} />
        <div className="mb-5 flex flex-wrap items-center gap-3"><label htmlFor="asset-kind" className="text-sm">收录类型</label><select id="asset-kind" className="h-9 rounded-md border bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value as CharacterAssetKind)}>{Object.entries(ASSET_KINDS).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select><Button variant="outline" size="sm" disabled={uploading || !hydrated} onClick={() => uploadRef.current?.click()}><ImagePlusIcon className="size-4" />{uploading ? '正在收录' : '上传生成结果'}</Button><input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadAsset} /></div>
        {!profile.assets.length && <p className="py-12 text-center text-sm text-muted-foreground">先在“继续创作”复制正脸任务，生成后上传第一张母版。</p>}
        <div className="grid gap-5 sm:grid-cols-2">{profile.assets.map((asset) => <article key={asset.id} className="min-w-0"><button className="flex aspect-[3/2] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-lg bg-muted/50" onClick={() => setZoom(asset)} aria-label={`放大${asset.title}`}><img src={asset.url} alt={asset.title} className="h-full w-full object-contain" loading="lazy" /></button><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">{asset.title}</h3><Badge variant={asset.review === 'reviewed' ? 'secondary' : 'outline'}>{asset.review === 'reviewed' ? '已做视觉核验' : '待验收'}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{asset.generator} · 母版关联 {asset.parentAssetIds.length} 项{asset.width ? ` · ${asset.width}×${asset.height}` : ''}</p><div className="mt-2 flex flex-wrap gap-1">{asset.review !== 'reviewed' && <Button size="sm" variant="ghost" onClick={() => { reviewAsset(profile.id, asset.id); toast.success('已标记为视觉验收通过') }}><CheckIcon className="size-3.5" />标记验收</Button>}<Button size="sm" variant="ghost" asChild><a href={asset.url} download={`${profile.slug}-${asset.kind}.png`}><DownloadIcon className="size-3.5" />下载图片</a></Button></div></article>)}</div>
      </>}
      {tab === 'create' && <><CharacterLooks profile={profile} /><p className="mb-5 max-w-prose text-sm leading-7 text-muted-foreground">选择要补充的资产，把任务和参考图交给 Codex 内置生图。生成后上传到关联资产中，也可带入现有合成台搭配服装和姿势。</p><div className="divide-y">{Object.entries(ASSET_KINDS).map(([value, meta]) => <div key={value} className="flex flex-wrap items-center justify-between gap-3 py-5"><div className="max-w-lg"><h2 className="text-base font-semibold">{meta.label}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{meta.instruction}</p></div><div className="flex flex-wrap gap-1"><Button variant="outline" size="sm" onClick={() => void copyTask(value as CharacterAssetKind)}><CopyIcon className="size-3.5" />复制 Codex 任务</Button><Button variant="ghost" size="sm" onClick={() => downloadJson({ character: profile, generator: 'Codex built-in image generation', kind: value, prompt: characterTaskPrompt(profile, value as CharacterAssetKind), references: profile.assets.filter((asset) => asset.kind === 'portrait' || asset.kind === 'turnaround').map((asset) => ({ title: asset.title, url: asset.url })) }, `${profile.slug}-${value}-task.json`)}>导出任务</Button></div></div>)}</div><div className="mt-6 flex flex-wrap items-center gap-3 text-sm"><Button variant="outline" asChild><Link to="/studio"><ArrowUpRightIcon className="size-4" />打开合成台</Link></Button><span className="text-muted-foreground">上方“带入角色合成台”会同时装入这位角色的档案。</span></div></>}
    </div>
    <Dialog open={Boolean(zoom)} onOpenChange={(open) => !open && setZoom(null)}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle>{zoom?.title}</DialogTitle><DialogDescription>{profile.name} · {zoom?.kind ? ASSET_KINDS[zoom.kind].label : ''}</DialogDescription></DialogHeader>{zoom && <img src={zoom.url} alt={zoom.title} className="max-h-[75dvh] w-full object-contain" />}</DialogContent></Dialog>
  </>
}
