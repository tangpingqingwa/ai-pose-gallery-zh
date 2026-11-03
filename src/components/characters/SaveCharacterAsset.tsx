import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { assetFor, ASSET_KINDS } from '@/lib/characters'
import { useCharacterLibrary } from '@/store/characterStore'
import { fileToDataUrl } from '@/services/aiGenerator'
import type { GenerationHistoryItem } from '@/types/gallery'

export function SaveCharacterAsset({ item }: { item: GenerationHistoryItem }) {
  const { profiles, addAsset } = useCharacterLibrary()
  const [busy, setBusy] = useState(false)
  if (!item.character) return null
  const character = item.character
  const profile = profiles.find((profile) => profile.id === character.id)
  const saved = profile?.assets.some((asset) => asset.sourceGenerationId === item.id)
  return <Button size="sm" variant="outline" className="mt-2 w-full text-xs" disabled={busy || saved || !profile} onClick={async () => {
    if (!profile) return
    setBusy(true)
    try {
      let url = item.imageUrl
      if (!url.startsWith('data:')) {
        const response = await fetch(url)
        if (!response.ok) throw new Error('下载生成结果失败，请下载后从档案上传')
        const blob = await response.blob()
        url = await fileToDataUrl(new File([blob], 'generated.png', { type: blob.type }))
      }
      const kind = item.assetKind ?? 'lifestyle'
      const parents = profile.assets.filter((asset) => item.referenceUrls?.includes(asset.url)).map((asset) => asset.id)
      const fallback = kind === 'portrait' ? undefined : assetFor(profile, 'portrait')
      addAsset(profile.id, { id: crypto.randomUUID(), kind, title: `${ASSET_KINDS[kind].label} · ${item.model}`, url, parentAssetIds: parents.length ? parents : fallback ? [fallback.id] : [], createdAt: new Date(item.createdAt).toISOString(), generator: item.model, prompt: item.prompt, review: 'unreviewed', sourceGenerationId: item.id, characterVersion: character.version, sourceReferenceUrls: item.referenceUrls, composition: item.composition })
      toast.success('成品已收录到所属角色，等待视觉验收')
    } catch (error) { toast.error(error instanceof Error ? error.message : '收录失败，请下载后从角色档案上传') }
    finally { setBusy(false) }
  }}>{saved ? '已收录到角色' : busy ? '正在收录' : '收录到角色资产'}</Button>
}
