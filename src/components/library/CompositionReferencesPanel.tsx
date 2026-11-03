import { CopyIcon, DownloadIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { buildCodexTask, downloadJson } from '@/lib/characters'
import { poseImagePath } from '@/lib/recipeImages'
import { createReferenceSheet } from '@/lib/referenceSheet'
import { useStudio } from '@/store/studioStore'
import type { ExtraReferenceImage } from '@/types/gallery'
import { ReferenceSlots } from './ReferenceSlots'

export function CompositionReferencesPanel({ prompt, workflowImages }: { prompt: string; workflowImages: ExtraReferenceImage[] }) {
  const [preparing, setPreparing] = useState(false)
  const { recipe, updateExtraImageInstruction } = useStudio()
  const normalized = recipe.pose ? { ...recipe, pose: { ...recipe.pose, 原图: poseImagePath(recipe.pose) } } : recipe
  const task = buildCodexTask(normalized, prompt, workflowImages)
  async function copy() {
    try {
      await navigator.clipboard.writeText([task.instruction, '', ...task.references.map((image, index) => `图${index + 1} · ${image.role} · ${image.name}：${image.url}`), '', task.prompt].join('\n'))
      toast.success('已复制七类素材组合任务与有序参考清单')
    } catch { toast.error('复制失败，请导出任务') }
  }
  async function downloadSheet() {
    setPreparing(true)
    try {
      const url = await createReferenceSheet(task.references, task.inputPlan.sheetReferenceIndices)
      const link = document.createElement('a')
      link.href = url; link.download = 'visual-references.png'; link.click()
      toast.success('参考拼图已下载；人像原图单独附给 Codex')
    } catch (error) { toast.error(error instanceof Error ? error.message : '参考拼图导出失败') }
    finally { setPreparing(false) }
  }
  const selected = (recipe.extraImages ?? []).filter((image) => image.source === 'library')
  return <section className="space-y-4 rounded-xl border p-4 sm:p-5" aria-label="素材合成参考">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">从七类素材自由组合</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">人像固定身份；穿搭、姿势、表情、妆发、体型细节与仪态各管对应部分。任意选用，无需先建档。</p></div><span className="text-xs text-muted-foreground">已选 {task.references.length} 张参考</span></div>
    <ReferenceSlots />
    {selected.length > 0 && <details className="rounded-lg bg-muted/50 p-3"><summary className="cursor-pointer text-xs font-medium">调整已选素材的使用目标 · {selected.length} 项</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{selected.map((image) => <label key={image.id} className="block space-y-2 text-xs"><span>{image.name}</span><Textarea aria-label={`参考目标 ${image.name}`} rows={3} value={image.instruction ?? ''} onChange={(event) => updateExtraImageInstruction(image.id, event.target.value)} /></label>)}</div></details>}
    <div className="flex flex-wrap gap-2"><Button onClick={() => void copy()} disabled={!task.references.length && !Object.keys(recipe.settingBindings ?? {}).length}><CopyIcon className="size-3.5" />复制 Codex 生图任务</Button><Button variant="outline" onClick={() => downloadJson(task, `${recipe.character?.id ?? 'visual-composition'}-task.json`)} disabled={!task.references.length && !Object.keys(recipe.settingBindings ?? {}).length}><DownloadIcon className="size-3.5" />导出任务</Button><Button variant="outline" onClick={() => void downloadSheet()} disabled={!task.references.length || preparing}><DownloadIcon className="size-3.5" />{preparing ? '正在准备拼图' : '下载参考拼图'}</Button></div>
    <p className="text-xs leading-6 text-muted-foreground">{task.inputPlan.mode === 'identity_and_sheet' ? '参考超过 5 张：下载拼图，将人像原图与拼图一起附给 Codex；编号仍与清单一致。' : '在 Codex 附上清单中的图片并使用内置生图。'}下方保留原有 API / ComfyUI 配置。</p>
  </section>
}
