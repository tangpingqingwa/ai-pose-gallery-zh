import type { CharacterProfile } from '@/types/character'
import type { VisualReferenceItem } from '@/types/gallery'
import { ageBand } from './library.ts'

export function characterVisualReferences(profiles: CharacterProfile[], previews: Record<string, string> = {}): VisualReferenceItem[] {
  return profiles.flatMap((profile) => profile.assets.flatMap((asset): VisualReferenceItem[] => {
    if (!['expressions', 'turnaround', 'detail', 'grooming', 'gesture'].includes(asset.kind)) return []
    const kind = asset.kind === 'turnaround' || asset.kind === 'detail' ? 'body-details' : asset.kind === 'gesture' ? 'mannerisms' : asset.kind as 'expressions' | 'grooming'
    const role = asset.kind === 'turnaround' ? 'body_guide' : asset.kind === 'detail' ? 'identity_detail' : asset.kind === 'gesture' ? 'gesture' : asset.kind === 'expressions' ? 'expression' : 'grooming'
    const feature = asset.kind === 'turnaround' ? `体型 · ${profile.appearance.bodyType}` : asset.kind === 'detail' ? '五官/皮肤细节' : asset.kind === 'expressions' ? '四态表情组' : asset.kind === 'grooming' ? '日常妆发' : '自然习惯动作'
    const instruction = asset.kind === 'turnaround' ? '设计新人物时参考体型轮廓与肩腰臀关系；已绑定人物时以该人物的身材设定和母版为准，不把参考图中的其他人或多视图复制进成片。' : asset.kind === 'detail' ? '仅参考细节展示方式与真实皮肤、手部纹理；当前人物五官结构以其人像母版为准，不借用另一人物的脸。' : asset.kind === 'expressions' ? '从参考组中借鉴自然微笑的眼睑和嘴角变化，成片只有一个人物，保留当前身份，不复制四格排版。' : asset.kind === 'grooming' ? '借鉴日常淡妆与自然收发方式，保留当前人物发色、五官、年龄和皮肤纹理，不复制其他人的脸。' : '借鉴自然倾听与放松时的视线、手势和肩颈状态，不替换当前人物外貌。'
    const skin = profile.appearance.skin
    const skinTone = /深棕|深褐|深色/.test(skin) ? '深肤色' : /橄榄|中棕|小麦|暖棕/.test(skin) ? '中等肤色' : /浅|白/.test(skin) ? '浅肤色' : '角色设定'
    return [{ id: `CHAR-REF-${asset.id}`, kind, title: `${profile.name} · ${asset.title}`, feature, description: `${profile.age} 岁 · ${profile.appearance.bodyType} · ${profile.tagline}`, presentation: profile.gender, ageBand: ageBand(profile.age), skinTone, url: asset.url, thumbnail: previews[asset.id] ?? asset.url, width: asset.width ?? 1024, height: asset.height ?? 1536, role, instruction, tags: [profile.appearance.bodyType, ...profile.appearance.marks], ownerCharacterId: profile.id, origin: 'character_asset' }]
  }))
}
