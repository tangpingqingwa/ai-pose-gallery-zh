import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowUpRightIcon, LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import lookData from '../../../data/ip-looks.json'
import { costumesQuery, posesQuery } from '@/api/gallery'
import { Button } from '@/components/ui/button'
import { useStudio } from '@/store/studioStore'
import type { CharacterLook, CharacterProfile } from '@/types/character'

export function CharacterLooks({ profile, stay = false }: { profile: CharacterProfile; stay?: boolean }) {
  const query = useQueryClient()
  const navigate = useNavigate()
  const { setCharacter } = useStudio()
  const [loading, setLoading] = useState('')
  const looks = (lookData as CharacterLook[]).filter((look) => look.characterId === profile.id)
  if (!looks.length) return null
  async function apply(look: CharacterLook) {
    setLoading(look.id)
    try {
      const [costumes, poses] = await Promise.all([look.costumeId ? query.ensureQueryData(costumesQuery) : Promise.resolve([]), query.ensureQueryData(posesQuery)])
      const costume = look.costumeId ? costumes.find((item) => item.id === look.costumeId) : null
      const pose = poses.items.find((item) => item.id === look.poseId)
      if ((look.costumeId && !costume) || !pose) throw new Error('当前图库缺少这套造型的服装或姿势，请重新选择')
      setCharacter(profile, { costume, pose, scene: look.scene, customOutfit: look.customOutfit, lookId: look.id })
      toast.success('角色、服装、姿势与场景已关联到配方')
      if (!stay) void navigate({ to: '/studio' })
    } catch (error) { toast.error(error instanceof Error ? error.message : '造型载入失败') }
    finally { setLoading('') }
  }
  return <section className="mb-7">
    <h2 className="text-base font-semibold">穿搭、动作与场景组合</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">每套造型关联具体参考编号，可载入合成台继续调整。</p>
    <div className="mt-4 grid gap-5 sm:grid-cols-3">{looks.map((look) => {
      const result = profile.assets.find((asset) => asset.composition?.lookId === look.id)
      return <article key={look.id} className="min-w-0">
        {result && <img src={result.url} alt={look.title} className="mb-3 aspect-[2/3] w-full rounded-lg object-cover" loading="lazy" />}
        <h3 className="text-sm font-medium leading-6">{look.title}</h3>
        <p className="mt-1 break-words font-mono text-[11px] leading-5 text-muted-foreground">{look.costumeId || '自定义穿搭'} · {look.poseId}</p>
        <Button className="mt-2" variant="outline" size="sm" disabled={Boolean(loading)} onClick={() => void apply(look)}>{loading === look.id ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <ArrowUpRightIcon className="size-3.5" />}载入这套造型</Button>
      </article>
    })}</div>
  </section>
}
