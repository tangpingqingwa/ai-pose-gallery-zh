import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DownloadIcon, PencilIcon, PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { matchesCatalog } from '@/lib/catalog'
import { downloadJson } from '@/lib/characters'
import { SETTING_CATEGORIES } from '@/lib/settingLibrary'
import { useSettingLibrary } from '@/store/settingStore'
import { useStudio } from '@/store/studioStore'
import type { SettingCategory, SettingGroup, SettingRecord } from '@/types/settings'

export function SettingLibraryPage({ group }: { group: SettingGroup }) {
  const { records, hydrated, storageError, saveRecord, deleteRecord, importRecords } = useSettingLibrary()
  const { recipe, setSettingRecord, randomizeSettingRecords } = useStudio()
  const [category, setCategory] = useState<SettingCategory | ''>('')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<SettingRecord | null>(null)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const categories = Object.entries(SETTING_CATEGORIES).filter(([, config]) => config.group === group) as [SettingCategory, typeof SETTING_CATEGORIES[SettingCategory]][]
  const scoped = records.filter((record) => SETTING_CATEGORIES[record.category].group === group)
  const filtered = scoped.filter((record) => (!category || record.category === category) && matchesCatalog([record.title, ...record.tags, ...Object.values(record.values)].join(' '), query))
  function open(record: SettingRecord) { setDraft(structuredClone(record)); setError('') }
  function create() { const selected = category || categories[0][0]; open({ id: `SET-${crypto.randomUUID()}`, category: selected, title: '', tags: [], values: Object.fromEntries(Object.keys(SETTING_CATEGORIES[selected].fields).map((field) => [field, ''])) }) }
  function save(associate: boolean) {
    if (!draft) return
    try { saveRecord(draft); if (associate) setSettingRecord(draft); setDraft(null); toast.success(associate ? '记录已保存并关联到本次创作' : '记录已保存') } catch (cause) { setError(cause instanceof Error ? cause.message : '保存失败') }
  }
  async function importFile(file?: File) {
    if (!file) return
    try { const count = importRecords(JSON.parse(await file.text())); toast.success(`已导入 ${count} 条记录`) } catch (cause) { toast.error(cause instanceof Error ? cause.message : '导入失败') }
    if (input.current) input.current.value = ''
  }
  const title = group === 'life' ? '个性与生活库' : '语言与声音库'
  return <>
    <PageHeader title={title} description={group === 'life' ? '职业、经历、生活节奏与个体表达可以分别选择和组合，保存为人物长期设定。' : '语言、方言口音、音色、音高、节奏和表达习惯分别记录，与人像自由关联。'} actions={<div className="flex gap-2"><Button variant="outline" onClick={() => { randomizeSettingRecords(group); toast.success('已随机关联未锁定的记录') }} disabled={!hydrated}>随机关联</Button><Button onClick={create} disabled={!hydrated}><PlusIcon className="size-3.5" />创建记录</Button></div>} />
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/50 p-4"><label className="min-w-40 space-y-1.5 text-xs"><span>记录分类</span><select aria-label="记录分类" className="h-9 w-full rounded-md border bg-background px-2" value={category} onChange={(event) => setCategory(event.target.value as SettingCategory | '')}><option value="">全部分类</option>{categories.map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}</select></label><label className="min-w-48 flex-1 space-y-1.5 text-xs"><span>搜索记录</span><Input aria-label="搜索记录" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="关键词、语言、地区或表达特点" /></label><Button variant="ghost" onClick={() => { setCategory(''); setQuery('') }}>重置筛选</Button></div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>{filtered.length} 条可选记录 · 指定关联会锁定，随机保留已锁定项</span><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => downloadJson(scoped, `${group}-setting-records.json`)}><DownloadIcon className="size-3.5" />导出记录</Button><Button variant="ghost" size="sm" onClick={() => input.current?.click()} disabled={!hydrated}><UploadIcon className="size-3.5" />导入记录</Button><input ref={input} type="file" accept="application/json,.json" className="hidden" aria-label="导入设定记录" onChange={(event) => void importFile(event.target.files?.[0])} /><Button size="sm" variant="outline" asChild><Link to="/studio">查看本次关联</Link></Button></div></div>
    {storageError && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm">本机存储暂不可用，请导出记录保留修改。</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((record) => {
      const binding = recipe.settingBindings?.[record.category]
      const selected = binding?.record.id === record.id && JSON.stringify(binding.record.values) === JSON.stringify(record.values)
      return <article key={record.id} className="setting-record-card flex min-w-0 flex-col rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">{SETTING_CATEGORIES[record.category].label}</span><h2 className="mt-2 text-base font-semibold">{record.title}</h2><p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-muted-foreground">{Object.values(record.values).join(' · ')}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant={selected ? 'secondary' : 'default'} disabled={!hydrated} onClick={() => setSettingRecord(record)} aria-label={`指定关联 ${record.title}`}>{selected ? binding.locked ? '已关联 · 已锁定' : '已关联' : '指定关联'}</Button><Button variant="ghost" size="sm" onClick={() => open(record)} aria-label={`编辑 ${record.title}`}><PencilIcon className="size-3.5" />查看 / 编辑</Button></div></article>
    })}</div>
    {!filtered.length && <div className="rounded-xl border p-8 text-center"><p className="text-sm">调整关键词，或创建一条自己的记录。</p><Button className="mt-3" variant="outline" onClick={create}>创建记录</Button></div>}
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>编辑{draft ? SETTING_CATEGORIES[draft.category].label : ''}记录</DialogTitle><DialogDescription>独立保存为素材，关联后也可固定到自有 IP。</DialogDescription></DialogHeader>{draft && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save(false) }}><label className="block space-y-2 text-sm"><span>记录名称</span><Input aria-label="记录名称" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label className="block space-y-2 text-sm"><span>分类</span><select aria-label="编辑记录分类" className="h-9 w-full rounded-md border bg-background px-2" value={draft.category} onChange={(event) => { const selected = event.target.value as SettingCategory; setDraft({ ...draft, category: selected, values: Object.fromEntries(Object.keys(SETTING_CATEGORIES[selected].fields).map((key) => [key, draft.values[key] ?? ''])) }) }}>{categories.map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}</select></label>{Object.entries(SETTING_CATEGORIES[draft.category].fields).map(([field, label]) => <label className="block space-y-2 text-sm" key={field}><span>{label}</span><Textarea required aria-label={label} rows={field === 'locale' ? 1 : 3} value={draft.values[field] ?? ''} onChange={(event) => setDraft({ ...draft, values: { ...draft.values, [field]: event.target.value } })} /></label>)}<label className="block space-y-2 text-sm"><span>检索标签</span><Input aria-label="检索标签" value={draft.tags.join('、')} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean) })} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap justify-between gap-3 border-t pt-4"><Button variant="ghost" type="button" disabled={!records.some((record) => record.id === draft.id)} onClick={() => { const deleted = structuredClone(draft); deleteRecord(draft.id); setDraft(null); toast('记录已移除，已有角色关联继续保留', { action: { label: '撤销', onClick: () => saveRecord(deleted) } }) }}><Trash2Icon className="size-3.5" />删除记录</Button><div className="flex gap-2"><Button type="submit" variant="outline">保存记录</Button><Button type="button" onClick={() => save(true)}>保存并关联</Button></div></div></form>}</DialogContent></Dialog>
  </>
}
