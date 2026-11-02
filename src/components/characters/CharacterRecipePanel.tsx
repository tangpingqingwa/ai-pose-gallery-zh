import { Link } from '@tanstack/react-router'
import { CopyIcon, DownloadIcon, UserRoundIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ASSET_KINDS, buildCodexTask, downloadJson } from '@/lib/characters'
import { poseImagePath } from '@/lib/recipeImages'
import { useStudio } from '@/store/studioStore'
import type { CharacterAssetKind } from '@/types/character'
import type { ExtraReferenceImage } from '@/types/gallery'

export function CharacterRecipePanel({ prompt, workflowImages }: { prompt: string; workflowImages: ExtraReferenceImage[] }) {
  const { recipe, setCharacterTask, setCharacterScene } = useStudio()
  if (!recipe.character) return null
  const profile = recipe.character
  const task = buildCodexTask(recipe.pose ? { ...recipe, pose: { ...recipe.pose, 原图: poseImagePath(recipe.pose) } } : recipe, prompt, workflowImages)
  async function copy() {
    try {
      await navigator.clipboard.writeText([task.instruction, '', ...task.references.map((reference, index) => `图${index + 1} · ${reference.role} · ${reference.name}：${reference.url}`), '', prompt].join('\n'))
      toast.success('已复制 Codex 内置生图任务和参考清单')
    } catch { toast.error('复制失败，请导出任务文件') }
  }
  return <section className="rounded-xl border p-4 sm:p-5" aria-label="已关联角色">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><UserRoundIcon className="size-4" /><h2 className="text-sm font-semibold">{profile.name} · 身份已关联</h2></div><p className="mt-2 text-xs leading-6 text-muted-foreground">{profile.age} 岁 · {profile.appearance.bodyType} · {profile.body.heightCm} cm · v{profile.version}。固定外貌和体型随配方传入。</p></div><Link className="text-xs underline underline-offset-4" to="/characters" search={{ id: profile.id }}>查看档案 / 收录结果</Link></div>
    <div className="mt-4 flex flex-wrap gap-1.5">{Object.entries(ASSET_KINDS).map(([kind, meta]) => <Button size="sm" variant={(recipe.characterTask ?? 'lifestyle') === kind ? 'secondary' : 'ghost'} key={kind} onClick={() => setCharacterTask(kind as CharacterAssetKind)}>{meta.label}</Button>)}</div>
    <label htmlFor="character-scene" className="mt-4 mb-2 block text-xs font-medium">场景、镜头与情绪</label><Textarea id="character-scene" value={recipe.scene ?? ''} onChange={(event) => setCharacterScene(event.target.value)} placeholder="例如：秋天的都柏林花店门前，阴天柔光，手扶腰，自然微笑。" rows={3} />
    <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void copy()}><CopyIcon className="size-4" />复制 Codex 生图任务</Button><Button variant="outline" onClick={() => downloadJson(task, `${profile.id}-composition-task.json`)}><DownloadIcon className="size-4" />导出任务</Button></div>
    <p className="mt-3 text-xs leading-6 text-muted-foreground">在 Codex 附上清单中的参考图并使用内置生图，生成后回到角色档案收录。下面的 API 生图保留为可选方式。</p>
  </section>
}
