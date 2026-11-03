import type { CharacterCreativeBrief, CharacterIdentity, CharacterProfile, CharacterWorld } from '@/types/character'
import type { ExtraReferenceImage, RecipeState } from '@/types/gallery'

export const WORLD_FIELDS = { occupation: '职业与能力边界', routine: '日常节奏', habits: '习惯与小动作', preferences: '喜好与取舍', imperfections: '不完美与局限', speechStyle: '说话方式', mannerisms: '表情与肢体习惯', boundaries: '人物一致性约束', personality: '性格与相处', background: '成长与经历' } as const

export function emptyWorld(): CharacterWorld {
  return { occupation: '', routine: '', habits: '', preferences: '', imperfections: '', speechStyle: '', mannerisms: '', boundaries: '', personality: '', background: '', belongings: [], wardrobe: [], relationships: [], events: [] }
}

export function emptyBrief(): CharacterCreativeBrief {
  return { belongingIds: [], action: '', emotion: '', camera: '', lighting: '', continuity: '', grooming: '' }
}

export function worldPrompt(profile: Pick<CharacterIdentity, 'world'>, brief?: CharacterCreativeBrief): string {
  const w = profile.world
  if (!w) return ''
  const props = w.belongings.filter((item) => brief?.belongingIds.includes(item.id))
  const wardrobe = w.wardrobe.find((item) => item.id === brief?.wardrobeId)
  const event = w.events.find((item) => item.id === brief?.eventId)
  const lines = [
    ...(w.personality ? [`性格与相处：${w.personality}`] : []),
    ...(w.background ? [`成长与经历：${w.background}`] : []),
    `人物背景：${w.occupation}；${w.routine}`,
    ...(w.preferences ? [`日常喜好与取舍：${w.preferences}`] : []),
    `个体表达：${w.habits}；${w.mannerisms}；${w.imperfections}`,
    `语言与性格参考：${w.speechStyle}。静态图片不渲染对白文字。`,
  ]
  if (props.length) lines.push(`本次随身特征：${props.map((item) => `${item.name}：${item.description}；${item.history}`).join('；')}。仅在自然需要时出现，不做单独物品陈列。`)
  if (wardrobe) lines.push(`日常穿着【${wardrobe.name}】：${wardrobe.description}。使用情境：${wardrobe.occasion}`)
  if (event) lines.push(`虚构经历【${event.date} · ${event.title}】：${event.summary}。对后续人物状态的影响：${event.consequence}`)
  if (brief) for (const [key, label] of Object.entries({ action: '习惯动作', emotion: '神态与情绪', grooming: '妆发状态', camera: '人物镜头', lighting: '光线', continuity: '人物一致性补充' }) as [keyof Pick<CharacterCreativeBrief, 'action' | 'emotion' | 'grooming' | 'camera' | 'lighting' | 'continuity'>, string][]) if (brief[key]) lines.push(`${label}：${brief[key]}`)
  if (w.boundaries) lines.push(`人物一致性：${w.boundaries}`)
  lines.push('画面以人物为中心，背景简洁弱化，不增加复杂空间、家具或装饰元素。经历与关系为虚构设定；只呈现本次选择的具体状态，不把所有爱好、缺点和道具堆进同一张图，不强制微笑或直视镜头。')
  return lines.join('\n')
}

export function worldReferences(profile: CharacterProfile): ExtraReferenceImage[] {
  const detail = profile.assets.findLast((asset) => asset.kind === 'detail' && asset.review === 'reviewed')
  return detail ? [{ id: `world:${detail.id}`, role: 'identity_detail', source: 'character_world', name: `${profile.name} 人物细节参考`, url: detail.url }] : []
}

export function applyCharacterBrief(recipe: RecipeState, profile: CharacterProfile, brief: CharacterCreativeBrief): RecipeState {
  if (recipe.character?.id !== profile.id || recipe.character.version !== profile.version) throw new Error('角色档案已更新，请重新载入角色后选择人物状态')
  validateBrief(profile.world, brief)
  const wardrobe = profile.world?.wardrobe.find((item) => item.id === brief.wardrobeId)
  return { ...recipe, creativeBrief: structuredClone(brief), scene: undefined, lookId: undefined,
    costume: wardrobe || recipe.creativeBrief?.wardrobeId ? null : recipe.costume,
    customOutfit: wardrobe?.description ?? (recipe.creativeBrief?.wardrobeId ? undefined : recipe.customOutfit),
    pose: brief.action ? null : recipe.pose,
    extraImages: [...(recipe.extraImages ?? []).filter((item) => item.source !== 'character_world'), ...worldReferences(profile)],
  }
}

export function validateBrief(world: CharacterWorld | undefined, brief: CharacterCreativeBrief): void {
  if (!world) throw new Error('请先补充角色生活档案')
  if (!brief || !Array.isArray(brief.belongingIds) || brief.belongingIds.some((id) => typeof id !== 'string' || !world.belongings.some((item) => item.id === id))) throw new Error('人物状态关联了不存在的随身特征')
  for (const key of ['action', 'emotion', 'camera', 'lighting', 'continuity'] as const) if (typeof brief[key] !== 'string') throw new Error('人物状态字段必须为文本')
  if (brief.grooming !== undefined && typeof brief.grooming !== 'string') throw new Error('妆发状态必须为文本')
  for (const [key, rows] of [['wardrobeId', world.wardrobe], ['eventId', world.events]] as const) if (brief[key] && !rows.some((row) => row.id === brief[key])) throw new Error(`人物状态关联不存在：${key}`)
}

export function validateWorld(world: CharacterWorld): void {
  if (!world || typeof world !== 'object') throw new Error('生活档案必须为对象')
  for (const key of Object.keys(WORLD_FIELDS) as (keyof typeof WORLD_FIELDS)[]) if (!['personality', 'background'].includes(key) && typeof world[key] !== 'string') throw new Error(`生活档案缺少：${WORLD_FIELDS[key]}`)
  for (const key of ['personality', 'background'] as const) if (world[key] !== undefined && typeof world[key] !== 'string') throw new Error(`生活档案字段无效：${WORLD_FIELDS[key]}`)
  const schemas = { belongings: ['name', 'description', 'history'], wardrobe: ['name', 'occasion', 'description'], relationships: ['name', 'role', 'dynamic'], events: ['date', 'title', 'summary', 'consequence'] } as const
  for (const [key, fields] of Object.entries(schemas)) {
    const rows = world[key as keyof typeof schemas]
    if (!Array.isArray(rows) || rows.length > 100) throw new Error(`生活档案 ${key} 清单格式无效`)
    const ids = new Set<string>()
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !/^[\w-]{1,100}$/.test(row.id) || ids.has(row.id)) throw new Error(`生活档案 ${key} 编号无效或重复`)
      ids.add(row.id)
      for (const field of fields) if (typeof (row as unknown as Record<string, unknown>)[field] !== 'string') throw new Error(`生活档案 ${key}.${field} 无效`)
    }
  }
  for (const event of world.events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || Number.isNaN(Date.parse(event.date)) || new Date(event.date).toISOString().slice(0, 10) !== event.date) throw new Error('经历日期需使用有效的 YYYY-MM-DD')
    validateBrief(world, { ...emptyBrief(), wardrobeId: event.wardrobeId, belongingIds: event.belongingIds })
  }
}
