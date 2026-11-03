import { Link } from '@tanstack/react-router'
import { DicesIcon, DownloadIcon, LockIcon, UnlockIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { downloadJson } from '@/lib/characters'
import { profileWithSettings, recipeVoiceTask, SETTING_CATEGORIES } from '@/lib/settingLibrary'
import { useCharacterLibrary } from '@/store/characterStore'
import { useSettingLibrary } from '@/store/settingStore'
import { useStudio } from '@/store/studioStore'
import type { SettingCategory, SettingGroup } from '@/types/settings'

export function SettingCompositionPanel() {
  const { records, hydrated } = useSettingLibrary()
  const { profiles, saveProfile } = useCharacterLibrary()
  const { recipe, setCharacter, setSettingRecord, removeSettingRecord, toggleSettingLock, randomizeSettingRecords } = useStudio()
  const bindings = recipe.settingBindings ?? {}
  const selectedCount = Object.keys(bindings).length
  const voice = recipeVoiceTask(recipe)
  function saveToCharacter() {
    try {
      const profile = profiles.find((item) => item.id === recipe.character?.id)
      if (!profile || profile.version !== recipe.character?.version) throw new Error('请先载入最新的自有角色档案')
      const next = profileWithSettings(profile, bindings)
      saveProfile(next)
      setCharacter({ ...next, version: profile.version + 1 }, { costume: recipe.costume, pose: recipe.pose, scene: recipe.scene, customOutfit: recipe.customOutfit, lookId: recipe.lookId, creativeBrief: recipe.creativeBrief })
      toast.success('关联记录已固定到角色，今后载入会继续沿用')
    } catch (error) { toast.error(error instanceof Error ? error.message : '保存失败') }
  }
  function section(group: SettingGroup, title: string) {
    const categories = (Object.entries(SETTING_CATEGORIES) as [SettingCategory, typeof SETTING_CATEGORIES[SettingCategory]][]).filter(([, config]) => config.group === group)
    const selected = categories.filter(([key]) => bindings[key])
    return <div className="min-w-0 rounded-lg bg-muted/40 p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title} · {selected.length} 项</h3><div className="flex items-center gap-1"><Button size="sm" variant="ghost" disabled={!hydrated} onClick={() => randomizeSettingRecords(group)}><DicesIcon className="size-3.5" />随机{group === 'life' ? '生活' : '声音'}设定</Button><Button size="sm" variant="ghost" asChild><Link to={group === 'life' ? '/traits' : '/voices'}>打开记录库</Link></Button></div></div><div className="mt-3 flex flex-wrap gap-2">{selected.length ? selected.map(([key, config]) => <span key={key} className="max-w-full rounded border bg-background px-2 py-1 text-xs leading-5" title={Object.values(bindings[key]!.record.values).join('\n')}>{config.label}：{bindings[key]!.record.title}{bindings[key]!.locked && <LockIcon className="ml-1 inline size-3" />}</span>) : <p className="text-xs leading-6 text-muted-foreground">{recipe.character ? '沿用角色档案，或从记录库选择本次设定。' : '从记录库指定选择，或先随机一组再调整。'}</p>}</div><details className="mt-3 border-t pt-3"><summary className="cursor-pointer text-xs font-medium">逐项选择与锁定</summary><div className="mt-4 space-y-3">{categories.map(([key, config]) => {
      const binding = bindings[key]
      return <div key={key} className="flex min-w-0 items-end gap-2"><label className="min-w-0 flex-1 space-y-1.5 text-xs"><span>{config.label}</span><select aria-label={`关联 ${config.label}`} className="h-9 w-full min-w-0 rounded-md border bg-background px-2" value={binding?.record.id ?? ''} onChange={(event) => { const record = records.find((item) => item.id === event.target.value); if (record) setSettingRecord(record); else removeSettingRecord(key) }}><option value="">{recipe.character ? '沿用角色档案' : '不关联'}</option>{binding && <option value={binding.record.id}>{binding.record.title}</option>}{records.filter((record) => record.category === key && record.id !== binding?.record.id).map((record) => <option key={record.id} value={record.id}>{record.title}</option>)}</select></label><Button size="icon" variant={binding?.locked ? 'secondary' : 'ghost'} className="size-9 shrink-0" disabled={!binding} aria-label={`锁定 ${config.label}`} aria-pressed={Boolean(binding?.locked)} onClick={() => toggleSettingLock(key)}>{binding?.locked ? <LockIcon className="size-3.5" /> : <UnlockIcon className="size-3.5" />}</Button></div>
    })}</div></details></div>
  }
  return <section aria-label="人物设定关联" className="space-y-4 rounded-xl border p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">本次人物设定</h2><p className="mt-1 max-w-3xl text-xs leading-6 text-muted-foreground">指定选择默认锁定，随机只替换未锁定项。设定可随本次任务使用，也可固定到自有 IP；语言与声音单独进入配音任务。</p></div><Button size="sm" disabled={!hydrated} onClick={() => randomizeSettingRecords()}><DicesIcon className="size-3.5" />随机关联设定</Button></div><div className="grid gap-3 lg:grid-cols-2">{section('life', '个性与生活')}{section('voice', '语言与声音')}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!recipe.character || !selectedCount} onClick={saveToCharacter}>固定到当前 IP</Button><Button size="sm" variant="outline" disabled={!selectedCount} onClick={() => downloadJson({ schemaVersion: 1, associations: bindings }, 'character-setting-associations.json')}><DownloadIcon className="size-3.5" />导出关联设定</Button>{voice && <Button size="sm" variant="outline" onClick={() => downloadJson(voice, 'character-voice-direction.json')}><DownloadIcon className="size-3.5" />导出配音任务</Button>}</div></section>
}
