import type { CharacterAssetKind, CharacterIdentity, CharacterProfile } from '@/types/character'
import type { ExtraReferenceImage, PortraitItem, RecipeState } from '@/types/gallery'
import { validateWorld, worldPrompt } from './characterWorld.ts'
import { validateVoice } from './characterVoice.ts'

export const ASSET_KINDS: Record<CharacterAssetKind, { label: string; instruction: string }> = {
  portrait: {
    label: '正脸母版',
    instruction: '只输出一张正面胸像照片，直视镜头，完整头部与肩膀，灰色纯净背景，柔和自然光，表情放松。',
  },
  turnaround: {
    label: '全身多视角',
    instruction: '输出一张横版三视角角色参考图：同一成年角色的正面、左侧面、后斜侧面。三个人物全身与鞋完整可见，体型和服装完全一致，灰色影棚背景。只有这三个人物视图，不加文字或标尺。',
  },
  expressions: {
    label: '表情设定',
    instruction: '输出一张 2×2 胸像表情参考图，同一成年角色依次为放松中性、自然露齿笑、专注思考、轻微惊讶。保持同一镜头、发型、肤色、服装及五官结构，不加文字。',
  },
  lifestyle: {
    label: '场景成片',
    instruction: '只输出一张完整的自然生活方式摄影，保持身份与体型，遵循已选服装、姿势、场景和镜头，避免过度修饰。',
  },
  detail: { label: '局部与微表情', instruction: '输出一张符合本次镜头要求的局部或微表情照片，保留该角色独特的皮肤、五官、手部与年龄纹理，不统一美化。' },
  gesture: { label: '习惯动作与仪态', instruction: '输出一张以人物为主的自然照片，呈现该角色特有的习惯动作、姿态、视线和情绪。背景简洁弱化，不新增空间、家具或装饰资产，不强制微笑或直视镜头。' },
  grooming: { label: '妆发与日常状态', instruction: '输出同一角色的妆发与日常状态参考，保留五官结构、年龄、肤色及体型，妆容与头发只作合理变化，不瘦脸磨皮，不把不同状态变成不同人物。背景简洁。' },
}

export function characterIdentity(profile: CharacterProfile): CharacterIdentity {
  const { id, version, name, displayName, age, gender, appearance, body, style, world, voice } = profile
  // Audio payloads live in the profile; recipes need only the voice design.
  return structuredClone({ id, version, name, displayName, age, gender, appearance, body, style, world, voice: voice ? { ...voice, samples: [] } : undefined })
}

export function identityPrompt(profile: CharacterIdentity): string {
  const a = profile.appearance
  const b = profile.body
  return [
    `角色身份：${profile.name}（${profile.id}，v${profile.version}），${profile.age} 岁成年${profile.gender}，原创虚构人物。`,
    `固定五官：脸型 ${a.face}；眼睛 ${a.eyes}；鼻子 ${a.nose}；嘴唇 ${a.lips}；眉形 ${a.brows}。`,
    `肤色与发型：${a.skin}；${a.hair}。辨识特征：${a.marks.join('；') || '以标准母版为准'}。`,
    `体型设计目标：${a.bodyType}，身高 ${b.heightCm} cm，体重 ${b.weightKg} kg，胸/腰/臀 ${b.chestCm}/${b.waistCm}/${b.hipsCm} cm，肩宽 ${b.shoulderCm} cm，内侧腿长 ${b.inseamCm} cm。`,
    '这些数值是角色设计目标，不能声称从图中精确测量。保持体型轮廓、肩腰臀关系与成年比例，不自动瘦身、增肌或拉长腿。',
    '保持皮肤毛孔、自然细纹和适度不对称；不磨皮、不改变年龄、不套用统一网红脸。服装与背景可变，身份固定。',
  ].join('\n')
}

export function assetFor(profile: CharacterProfile, kind: CharacterAssetKind) {
  // Prefer the most recently reviewed reference, then the most recent generated asset.
  const matches = profile.assets.filter((asset) => asset.kind === kind)
  return matches.findLast((asset) => asset.review === 'reviewed') ?? matches.at(-1)
}

export function mergeCharacterProfile(seed: CharacterProfile | undefined, local: CharacterProfile): CharacterProfile {
  if (!seed) return local
  const assets = new Map(seed.assets.map((asset) => [asset.id, asset]))
  for (const asset of local.assets) assets.set(asset.id, asset)
  return { ...seed, ...local, version: Math.max(seed.version, local.version), world: local.world ?? seed.world, voice: local.voice ?? seed.voice, assets: [...assets.values()] }
}

export function portraitFor(profile: CharacterProfile): PortraitItem | null {
  const asset = assetFor(profile, 'portrait')
  if (!asset) return null
  return {
    id: `character:${profile.id}`, source: 'character', 分区: '自有角色', 发长: '',
    发型名称: profile.name, 标题: `${profile.displayName} · ${profile.tagline}`,
    宽: asset.width ?? 1024, 高: asset.height ?? 1536, 字节数: 0,
    精选: false, 热门: false, 缩略图: asset.url, 原图: asset.url,
    检索: [profile.name, profile.displayName, profile.tagline, ...Object.values(profile.appearance).flat(), ...profile.persona.topics, profile.world?.occupation, profile.baseCity].join(' '),
  }
}

export function recipeForCharacter(profile: CharacterProfile, previous: RecipeState): RecipeState {
  const portrait = portraitFor(profile)
  if (!portrait) throw new Error('请先为角色上传或生成正脸母版')
  const body = assetFor(profile, 'turnaround')
  return {
    ...previous,
    scene: undefined, customOutfit: undefined, lookId: undefined, creativeBrief: undefined,
    character: characterIdentity(profile), characterTask: 'lifestyle', portrait,
    extraImages: [
      ...(previous.extraImages ?? []).filter((ref) => ref.role !== 'character_body' && ref.source !== 'character_world'),
      ...(body ? [{ id: `body:${profile.id}`, role: 'character_body' as const, name: `${profile.name} 全身体型参考`, url: body.url }] : []),
    ],
  }
}

export function detachCharacter(recipe: RecipeState): RecipeState {
  return { ...recipe, character: null, characterTask: undefined, scene: undefined, customOutfit: undefined, lookId: undefined, creativeBrief: undefined, extraImages: (recipe.extraImages ?? []).filter((ref) => ref.role !== 'character_body' && ref.source !== 'character_world') }
}

export function characterTaskPrompt(profile: CharacterIdentity, kind: CharacterAssetKind): string {
  return [identityPrompt(profile), `本次任务：${ASSET_KINDS[kind].instruction}`, worldPrompt(profile), `默认穿搭：${profile.style.signatureOutfit}。`, '如提供参考图，正脸母版固定身份，全身多视角固定体型，不能把同一人的多视角复制成场景中的多个人。照片真实自然，无文字、标志或水印。'].filter(Boolean).join('\n\n')
}

export function buildCodexTask(recipe: RecipeState, prompt: string, workflowImages: ExtraReferenceImage[] = []) {
  const references = [
    ...workflowImages.filter((ref) => ref.role === 'character_sheet').map((ref) => ({ role: ref.role, name: ref.name, url: ref.url })),
    ...(recipe.portrait ? [{ role: 'identity', name: recipe.portrait.标题, url: recipe.portrait.原图 || recipe.portrait.缩略图 }] : []),
    ...(recipe.costume ? [{ role: 'outfit', name: recipe.costume.服装名称, url: recipe.costume.预览图 || recipe.costume.原图 }] : []),
    ...(recipe.pose ? [{ role: 'pose', name: recipe.pose.姿势名称, url: recipe.pose.原图 }] : []),
    ...workflowImages.filter((ref) => ref.role !== 'character_sheet').map((ref) => ({ role: ref.role ?? 'supporting', name: ref.name, url: ref.url })),
    ...(recipe.extraImages ?? []).map((ref) => ({ role: ref.role ?? 'supporting', name: ref.name, url: ref.url })),
  ]
  return { schemaVersion: 1, generator: 'Codex built-in image generation', instruction: '使用 Codex 内置生图，按 references 顺序附上参考图，再执行 prompt。生成后将成品收录到所列角色。', character: recipe.character ?? null, kind: recipe.characterTask ?? 'lifestyle', composition: { lookId: recipe.lookId, costumeId: recipe.costume?.id, poseId: recipe.pose?.id, scene: recipe.scene, customOutfit: recipe.customOutfit, creativeBrief: recipe.creativeBrief }, prompt, references }
}

export function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function validateCharacter(value: unknown): asserts value is CharacterProfile {
  if (!value || typeof value !== 'object') throw new Error('角色档案必须为对象')
  const p = value as CharacterProfile
  if (p.schemaVersion !== 1 || typeof p.id !== 'string' || !/^[\w-]{1,80}$/.test(p.id) || typeof p.name !== 'string' || !p.name.trim()) throw new Error('角色 ID、名称或档案版本无效')
  if (!Number.isInteger(p.version) || p.version < 1 || !Number.isFinite(p.age) || p.age < 18 || p.age > 100) throw new Error('请设置有效角色版本和成年年龄（18–100）')
  for (const key of ['slug', 'displayName', 'gender', 'baseCity', 'tagline', 'updatedAt'] as const) if (typeof p[key] !== 'string') throw new Error(`缺少字段：${key}`)
  if (p.body?.basis !== 'design_target') throw new Error('身材数据必须明确为设计目标')
  const ranges: Record<string, [number, number]> = { heightCm: [120, 230], weightKg: [30, 220], chestCm: [50, 200], waistCm: [40, 200], hipsCm: [50, 200], shoulderCm: [25, 70], inseamCm: [45, 120] }
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const n = p.body[key as keyof typeof p.body]
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error(`身材字段 ${key} 需在 ${min}–${max} 范围内`)
  }
  if (!p.appearance || !Array.isArray(p.appearance.marks) || !p.style || !p.persona || !p.rights || !Array.isArray(p.assets) || !Array.isArray(p.market)) throw new Error('外貌、人设、风格、来源或资产清单不完整')
  for (const key of ['skin', 'hair', 'eyes', 'face', 'nose', 'lips', 'brows', 'bodyType', 'promptEn', 'bodyEn'] as const) if (typeof p.appearance[key] !== 'string') throw new Error(`外貌字段 ${key} 无效`)
  for (const group of [p.appearance.marks, p.market, p.persona.topics, p.persona.personality, p.style.palette]) if (!Array.isArray(group) || group.some((s) => typeof s !== 'string')) throw new Error('标签必须为文本数组')
  for (const s of [p.persona.positioning, p.persona.bio, p.persona.voice, p.style.signatureOutfit, p.style.outfitEn, p.rights.origin, p.rights.generator, p.rights.licenseNote, p.rights.source, p.rights.createdAt]) if (typeof s !== 'string') throw new Error('人设、风格或来源字段格式错误')
  if (p.world !== undefined) validateWorld(p.world)
  if (p.voice !== undefined) validateVoice(p.voice)
  const ids = new Set<string>()
  for (const asset of p.assets) {
    if (!asset || typeof asset.id !== 'string' || ids.has(asset.id) || !Object.hasOwn(ASSET_KINDS, asset.kind) || typeof asset.url !== 'string' || !/^(\/[^/]|data:image\/(png|jpeg|webp);base64,|https:\/\/)/.test(asset.url) || typeof asset.prompt !== 'string' || typeof asset.title !== 'string' || typeof asset.generator !== 'string' || typeof asset.createdAt !== 'string' || !['reviewed', 'unreviewed'].includes(asset.review) || !Array.isArray(asset.parentAssetIds) || asset.parentAssetIds.some((id) => typeof id !== 'string')) throw new Error('资产 ID、类型、图片地址或溯源字段无效')
    ids.add(asset.id)
  }
  if (p.assets.some((asset) => asset.parentAssetIds.some((id) => !ids.has(id) || id === asset.id))) throw new Error('资产的母版关联不存在或关联了自身')
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const parents = new Map(p.assets.map((asset) => [asset.id, asset.parentAssetIds]))
  function visit(id: string) {
    if (visiting.has(id)) throw new Error('资产母版关联存在循环')
    if (visited.has(id)) return
    visiting.add(id)
    for (const parent of parents.get(id) ?? []) visit(parent)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of ids) visit(id)
}
