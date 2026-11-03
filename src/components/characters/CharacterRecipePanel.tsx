import { Link } from '@tanstack/react-router'
import { UserRoundIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ASSET_KINDS } from '@/lib/characters'
import { useStudio } from '@/store/studioStore'
import type { CharacterAssetKind } from '@/types/character'
import { CharacterStateComposer } from './CharacterStateComposer'

export function CharacterRecipePanel() {
  const { recipe, setCharacterTask, setCharacterScene } = useStudio()
  if (!recipe.character) return null
  const profile = recipe.character
  return <section className="rounded-xl border p-4 sm:p-5" aria-label="已关联角色">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><UserRoundIcon className="size-4" /><h2 className="text-sm font-semibold">{profile.name} · 身份已关联</h2></div><p className="mt-2 text-xs leading-6 text-muted-foreground">{profile.age} 岁 · {profile.appearance.bodyType} · {profile.body.heightCm} cm · v{profile.version}。固定外貌和体型随配方传入。</p></div><Link className="text-xs underline underline-offset-4" to="/characters" search={{ id: profile.id }}>查看档案 / 收录结果</Link></div>
    <div className="mt-4 flex flex-wrap gap-1.5">{Object.entries(ASSET_KINDS).map(([kind, meta]) => <Button size="sm" variant={(recipe.characterTask ?? 'lifestyle') === kind ? 'secondary' : 'ghost'} key={kind} onClick={() => setCharacterTask(kind as CharacterAssetKind)}>{meta.label}</Button>)}</div>
    <CharacterStateComposer key={`${profile.id}:${profile.version}:${recipe.characterTask}:${recipe.costume?.id}:${recipe.pose?.id}:${JSON.stringify(recipe.creativeBrief)}`} />
    <label htmlFor="character-scene" className="mt-4 mb-2 block text-xs font-medium">简单背景与补充要求</label><Textarea id="character-scene" value={recipe.scene ?? ''} onChange={(event) => setCharacterScene(event.target.value)} placeholder="例如：简洁虚化背景，自然窗光，以人物神态为主。" rows={2} />
    {profile.voice && <p className="mt-3 text-xs leading-6 text-muted-foreground">声音档案：{profile.voice.language} · {profile.voice.dialect} · {profile.voice.accentStrength}。配音任务与音频在角色档案管理。</p>}
  </section>
}
