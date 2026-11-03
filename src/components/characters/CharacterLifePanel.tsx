import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PencilIcon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WORLD_FIELDS, emptyBrief, emptyWorld, validateWorld } from '@/lib/characterWorld'
import { bindingsAfterManualEdit } from '@/lib/settingLibrary'
import { useCharacterLibrary } from '@/store/characterStore'
import { useStudio } from '@/store/studioStore'
import type { CharacterEvent, CharacterProfile, CharacterWorld } from '@/types/character'

const COLLECTIONS = {
  wardrobe: { title: '日常穿着', fields: { name: '名称', occasion: '使用情境', description: '穿着与适配' }, blank: { id: '', name: '', occasion: '', description: '' } },
  belongings: { title: '随身特征', fields: { name: '名称', description: '外观特征', history: '来历与使用痕迹' }, blank: { id: '', name: '', description: '', history: '' } },
  relationships: { title: '人物关系', fields: { name: '称呼', role: '关系', dynamic: '相处方式' }, blank: { id: '', name: '', role: '', dynamic: '' } },
  events: { title: '个人经历', fields: { date: '设定日期', title: '经历标题', summary: '发生了什么', consequence: '如何影响后续状态' }, blank: { id: '', date: '2026-11-02', title: '', summary: '', consequence: '', belongingIds: [] } },
} as const

function LifeEditor({ profile, onClose }: { profile: CharacterProfile; onClose: () => void }) {
  const { saveProfile } = useCharacterLibrary()
  const [draft, setDraft] = useState<CharacterWorld>(() => structuredClone(profile.world ?? emptyWorld()))
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  function collection(key: keyof typeof COLLECTIONS) {
    const config = COLLECTIONS[key]
    const rows = draft[key]
    return <section key={key} className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{config.title}</h3><Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, [key]: [...rows, { ...structuredClone(config.blank), id: crypto.randomUUID() }] })}><PlusIcon className="size-3.5" />添加</Button></div>{rows.map((row, index) => <details key={row.id} className="rounded-lg border p-3" open={index === rows.length - 1}><summary className="cursor-pointer text-sm">{'name' in row ? row.name || '待命名' : row.title || '待命名'}</summary><div className="mt-4 space-y-3">{Object.entries(config.fields).map(([field, label]) => <label key={field} className="block space-y-1.5 text-xs"><span>{config.title} · {label}</span>{field === 'date' || field === 'name' || field === 'title' ? <Input required type={field === 'date' ? 'date' : 'text'} value={String((row as unknown as Record<string, unknown>)[field] ?? '')} onChange={(event) => setDraft({ ...draft, [key]: rows.map((item) => item.id === row.id ? { ...item, [field]: event.target.value } : item) })} /> : <Textarea rows={2} value={String((row as unknown as Record<string, unknown>)[field] ?? '')} onChange={(event) => setDraft({ ...draft, [key]: rows.map((item) => item.id === row.id ? { ...item, [field]: event.target.value } : item) })} />}</label>)}{key === 'events' && <label className="block space-y-1.5 text-xs"><span>经历使用的日常穿着</span><select className="h-9 w-full rounded-md border bg-background px-2" value={(row as CharacterEvent).wardrobeId ?? ''} onChange={(event) => setDraft({ ...draft, events: draft.events.map((item) => item.id === row.id ? { ...item, wardrobeId: event.target.value || undefined } : item) })}><option value="">不指定</option>{draft.wardrobe.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...draft, [key]: rows.filter((item) => item.id !== row.id), ...(key === 'belongings' ? { events: draft.events.map((event) => ({ ...event, belongingIds: event.belongingIds.filter((id) => id !== row.id) })) } : key === 'wardrobe' ? { events: draft.events.map((event) => ({ ...event, wardrobeId: event.wardrobeId === row.id ? undefined : event.wardrobeId })) } : {}) })}><Trash2Icon className="size-3.5" />删除此条</Button></div></details>)}</section>
  }
  function save() {
    try { validateWorld(draft); saveProfile({ ...profile, world: draft, settingBindings: bindingsAfterManualEdit(profile.settingBindings, 'life', draft) }); onClose(); toast.success('生活与个性档案已保存') } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败') }
  }
  const fields = Object.entries(WORLD_FIELDS).slice(step === 0 ? 0 : 4, step === 0 ? 4 : undefined)
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>编辑生活与个性</DialogTitle><DialogDescription>描述这个人的取舍、习惯与变化。穿着和随身物品是可选人物特征。</DialogDescription></DialogHeader><div className="flex flex-wrap gap-1">{['日常与喜好', '表达与局限', '穿着与随身', '关系与经历'].map((label, index) => <Button key={label} type="button" size="sm" variant={step === index ? 'secondary' : 'ghost'} onClick={() => setStep(index)}>{index + 1}. {label}</Button>)}</div><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (step < 3) setStep(step + 1); else save() }}>{step < 2 ? fields.map(([key, label]) => <label className="block space-y-2 text-sm" key={key}><span>{label}</span><Textarea value={draft[key as keyof typeof WORLD_FIELDS] ?? ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} rows={3} /></label>) : step === 2 ? <>{collection('wardrobe')}{collection('belongings')}</> : <>{collection('relationships')}{collection('events')}</>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-between border-t pt-4"><Button type="button" variant="ghost" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? '上一步' : '取消'}</Button><Button type="submit">{step < 3 ? '下一步' : '保存生活档案'}</Button></div></form></DialogContent></Dialog>
}

export function CharacterLifePanel({ profile }: { profile: CharacterProfile }) {
  const [editing, setEditing] = useState(false)
  const { setCharacter } = useStudio()
  const { hydrated } = useCharacterLibrary()
  const navigate = useNavigate()
  const w = profile.world
  function createFromEvent(event: CharacterEvent) {
    try { setCharacter(profile, { creativeBrief: { ...emptyBrief(), eventId: event.id, belongingIds: event.belongingIds, wardrobeId: event.wardrobeId, action: event.summary, continuity: event.consequence, camera: '以人物为中心的自然近景，简洁弱化背景' } }); void navigate({ to: '/studio' }) } catch (error) { toast.error(error instanceof Error ? error.message : '请先添加人物母版') }
  }
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">这个人如何生活和表达</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">生活档案为创作设定，选择具体状态后才带入本次任务。</p></div><Button size="sm" variant="outline" disabled={!hydrated} onClick={() => setEditing(true)}><PencilIcon className="size-3.5" />编辑生活档案</Button></div>{w ? <><dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{Object.entries(WORLD_FIELDS).map(([key, label]) => <div key={key}><dt className="text-sm font-medium">{label}</dt><dd className="mt-2 text-sm leading-7 text-muted-foreground">{w[key as keyof typeof WORLD_FIELDS] || '待补充'}</dd></div>)}</dl><div className="space-y-3">{(['wardrobe', 'belongings', 'relationships'] as const).map((key) => <details key={key} className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">{COLLECTIONS[key].title} · {w[key].length} 条设定</summary><div className="mt-4 grid gap-5 sm:grid-cols-2">{w[key].map((item) => <article key={item.id}><h3 className="text-sm font-medium">{item.name}</h3>{Object.entries(COLLECTIONS[key].fields).filter(([field]) => field !== 'name').map(([field, label]) => <p key={field} className="mt-2 text-sm leading-6 text-muted-foreground"><span>{label}：</span>{String((item as unknown as Record<string, unknown>)[field])}</p>)}</article>)}</div></details>)}</div><section><h2 className="font-semibold">经历如何影响当下</h2><div className="mt-4 divide-y">{[...w.events].sort((a, b) => a.date.localeCompare(b.date)).map((event) => <article key={event.id} className="py-4"><p className="font-mono text-xs text-muted-foreground">{event.date} · 虚构经历</p><h3 className="mt-2 text-sm font-semibold">{event.title}</h3><p className="mt-2 text-sm leading-7">{event.summary}</p><p className="mt-1 text-sm leading-7 text-muted-foreground">后续影响：{event.consequence}</p><Button className="mt-3" size="sm" variant="outline" disabled={!profile.assets.some((asset) => asset.kind === 'portrait')} onClick={() => createFromEvent(event)}><SparklesIcon className="size-3.5" />以这段经历创作人物</Button></article>)}</div></section></> : <p className="rounded-xl border p-6 text-sm text-muted-foreground">从日常习惯、说话方式和一段经历开始，补充这位角色。</p>}{editing && <LifeEditor profile={profile} onClose={() => setEditing(false)} />}</div>
}
