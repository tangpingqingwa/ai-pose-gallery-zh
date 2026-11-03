import { Link, useLocation } from '@tanstack/react-router'
import { CopyIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReferenceSlots } from '@/components/library/ReferenceSlots'
import { buildCodexTask } from '@/lib/characters'
import { poseImagePath } from '@/lib/recipeImages'
import { workflowIdentity } from '@/lib/comfyWorkflowParameters'
import { buildRecipePrompt } from '@/services/aiGenerator'
import { useStudio } from '@/store/studioStore'

export function RecipeDock() {
  const { pathname } = useLocation()
  const { recipe, apiConfig, clearRecipe, isGenerating } = useStudio()
  if (['/studio', '/settings', '/guide', '/characters', '/library-quality'].some((path) => pathname.startsWith(path))) return null
  const workflowImages = apiConfig.activeProvider === 'comfyui' && recipe.workflowImagesIdentity === workflowIdentity(apiConfig.comfyuiParams.workflowJson) ? Object.values(recipe.workflowImages ?? {}) : []
  const normalized = recipe.pose ? { ...recipe, pose: { ...recipe.pose, 原图: poseImagePath(recipe.pose) } } : recipe
  const task = buildCodexTask(normalized, buildRecipePrompt(recipe, apiConfig.stylePreset, workflowImages), workflowImages)
  async function copy() {
    try { await navigator.clipboard.writeText([task.instruction, ...task.references.map((image, index) => `图${index + 1} · ${image.role} · ${image.name}：${image.url}`), '', task.prompt].join('\n')); toast.success('已复制素材组合任务') } catch { toast.error('复制失败，可到创作台导出任务') }
  }
  return <section className="sticky bottom-3 z-30 mx-auto mt-4 w-full max-w-6xl rounded-xl border bg-card/95 p-2.5 shadow-lg backdrop-blur-md" aria-label="七库素材配方栏">
    <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[11px] text-muted-foreground">七类参考 · 任意选用{recipe.portrait ? ' · 人像已固定' : ''}</p><div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!task.references.length} onClick={() => void copy()}><CopyIcon className="size-3" />复制任务</Button>{task.references.length > 0 && <Button variant="ghost" size="icon" className="size-7" onClick={clearRecipe} aria-label="清空素材配方"><Trash2Icon className="size-3" /></Button>}<Button size="sm" className="h-7 px-2.5 text-xs" asChild><Link to="/studio"><SparklesIcon className="size-3" />{isGenerating ? '生成中' : '人物创作'}{task.references.length ? ` · ${task.references.length}` : ''}</Link></Button></div></div>
    <ReferenceSlots compact />
    {task.inputPlan.mode === 'identity_and_sheet' && <p className="mt-2 text-[11px] text-muted-foreground">已超过 5 张参考，可到人物创作下载拼图，与人像原图一起交给 Codex。</p>}
  </section>
}
