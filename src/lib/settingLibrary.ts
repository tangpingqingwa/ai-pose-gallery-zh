import type { CharacterIdentity, CharacterProfile, CharacterVoice } from '@/types/character'
import type { RecipeState } from '@/types/gallery'
import type { SettingBindings, SettingCategory, SettingGroup, SettingRecord } from '@/types/settings'
import { emptyWorld } from './characterWorld.ts'
import { emptyVoice, voiceTask } from './characterVoice.ts'

export const SETTING_CATEGORIES: Record<SettingCategory, { label: string; group: SettingGroup; fields: Record<string, string> }> = {
  personality: { label: '性格与相处', group: 'life', fields: { personality: '性格特点与相处方式' } },
  occupation: { label: '职业与能力', group: 'life', fields: { occupation: '职业、擅长事项与能力边界' } },
  background: { label: '成长与经历', group: 'life', fields: { background: '虚构经历及对性格的影响' } },
  routine: { label: '日常节奏', group: 'life', fields: { routine: '日常生活与工作节奏' } },
  habits: { label: '习惯与小动作', group: 'life', fields: { habits: '习惯、小动作及触发情境' } },
  preferences: { label: '喜好与取舍', group: 'life', fields: { preferences: '喜好、预算与日常取舍' } },
  imperfections: { label: '不完美与局限', group: 'life', fields: { imperfections: '自然局限及具体表现' } },
  speechStyle: { label: '说话方式', group: 'life', fields: { speechStyle: '表达方式与交流习惯' } },
  mannerisms: { label: '表情与肢体习惯', group: 'life', fields: { mannerisms: '习惯神态、视线与肢体表现' } },
  boundaries: { label: '人物一致性', group: 'life', fields: { boundaries: '需要长期保留的人物约束' } },
  language: { label: '语言与地区口音', group: 'voice', fields: { language: '主要语言', locale: '语言地区标记', dialect: '方言或地区变体', accent: '口音设定', accentStrength: '口音强弱', pronunciation: '地区发音方向', sampleText: '试读文本' } },
  multilingual: { label: '其他语言与切换', group: 'voice', fields: { secondaryLanguages: '其他语言、熟练度与切换习惯' } },
  timbre: { label: '音色与质感', group: 'voice', fields: { timbre: '音色与共鸣特点' } },
  pitch: { label: '音高范围', group: 'voice', fields: { pitch: '自然音区与变化范围' } },
  pace: { label: '语速与停顿', group: 'voice', fields: { pace: '语速、呼吸与停顿方式' } },
  prosody: { label: '语调与重音', group: 'voice', fields: { prosody: '语调、句末走向和重音' } },
  speechHabits: { label: '惯用表达', group: 'voice', fields: { speechHabits: '惯用表达及使用频率' } },
  pronunciation: { label: '发音与姓名读法', group: 'voice', fields: { pronunciation: '个人发音习惯与专有名词读法' } },
  avoid: { label: '声音一致性', group: 'voice', fields: { avoid: '需要避免的声音变化' } },
}

export function validateSettingRecord(value: unknown): asserts value is SettingRecord {
  if (!value || typeof value !== 'object') throw new Error('设定记录必须为对象')
  const record = value as SettingRecord
  if (typeof record.id !== 'string' || !/^[\w-]{1,100}$/.test(record.id) || !Object.hasOwn(SETTING_CATEGORIES, record.category)) throw new Error('设定记录编号或分类无效')
  if (typeof record.title !== 'string' || !record.title.trim() || record.title.length > 120 || !Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== 'string')) throw new Error('请填写名称和有效标签')
  const fields = SETTING_CATEGORIES[record.category].fields
  if (!record.values || Object.keys(record.values).some((key) => !Object.hasOwn(fields, key))) throw new Error('记录包含不属于此分类的字段')
  for (const key of Object.keys(fields)) if (typeof record.values[key] !== 'string' || !record.values[key].trim() || record.values[key].length > 6000) throw new Error(`请填写：${fields[key]}`)
  if (record.category === 'language' && !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(record.values.locale)) throw new Error('语言地区标记格式无效，例如 es-MX')
  if (record.localePrefixes !== undefined && (!Array.isArray(record.localePrefixes) || record.localePrefixes.some((locale) => typeof locale !== 'string'))) throw new Error('语言适配条件无效')
}

export function validateSettingBindings(bindings: SettingBindings) {
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings)) throw new Error('设定关联格式无效')
  for (const [category, binding] of Object.entries(bindings)) {
    if (!binding || category !== binding.record?.category || typeof binding.locked !== 'boolean' || !['specified', 'random'].includes(binding.origin)) throw new Error('设定关联的分类或锁定状态无效')
    validateSettingRecord(binding.record)
  }
}

export function chooseSetting(bindings: SettingBindings = {}, record: SettingRecord): SettingBindings {
  validateSettingRecord(record)
  return { ...bindings, [record.category]: { record: structuredClone(record), locked: true, origin: 'specified' } }
}

export function bindingsAfterManualEdit(bindings: SettingBindings = {}, group: SettingGroup, edited: object): SettingBindings {
  const next = structuredClone(bindings)
  for (const [category, binding] of Object.entries(next) as [SettingCategory, NonNullable<SettingBindings[SettingCategory]>][]) {
    if (SETTING_CATEGORIES[category].group !== group) continue
    const matches = Object.entries(binding.record.values).every(([field, value]) => {
      const actual = (edited as Record<string, unknown>)[field]
      return actual === value || (field === 'pronunciation' && typeof actual === 'string' && actual.includes(value))
    })
    if (!matches) delete next[category]
  }
  return next
}

function acceptsLocale(record: SettingRecord, locale: string) {
  return !record.localePrefixes?.length || record.localePrefixes.some((prefix) => locale.toLowerCase() === prefix.toLowerCase() || locale.toLowerCase().startsWith(prefix.toLowerCase() + '-'))
}

export function randomSettingBindings(records: SettingRecord[], previous: SettingBindings = {}, group?: SettingGroup, random = Math.random): SettingBindings {
  const next = structuredClone(previous)
  for (const [category, config] of Object.entries(SETTING_CATEGORIES) as [SettingCategory, typeof SETTING_CATEGORIES[SettingCategory]][]) {
    if ((group && config.group !== group) || next[category]?.locked) continue
    const locale = next.language?.record.values.locale ?? ''
    const pool = records.filter((record) => record.category === category && (category === 'language'
      ? Object.values(next).filter((binding) => binding?.locked).every((binding) => acceptsLocale(binding!.record, record.values.locale))
      : acceptsLocale(record, locale)))
    if (!pool.length) { delete next[category]; continue }
    const current = next[category]?.record.id
    const choices = pool.length > 1 ? pool.filter((record) => record.id !== current) : pool
    const record = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]
    next[category] = { record: structuredClone(record), locked: false, origin: 'random' }
  }
  return next
}

export function compositionWorld(recipe: RecipeState) {
  const bindings = Object.values(recipe.settingBindings ?? {}).filter((binding) => binding && SETTING_CATEGORIES[binding.record.category].group === 'life')
  if (!recipe.character?.world && !bindings.length) return undefined
  return Object.assign(emptyWorld(), structuredClone(recipe.character?.world ?? {}), ...bindings.map((binding) => binding!.record.values))
}

export function compositionVoice(recipe: RecipeState): CharacterVoice {
  const records = (Object.keys(SETTING_CATEGORIES) as SettingCategory[]).map((category) => recipe.settingBindings?.[category]).filter((binding) => binding && SETTING_CATEGORIES[binding.record.category].group === 'voice')
  // Speech samples belong to the fixed voice they were recorded for, not a newly randomized voice.
  const voice = Object.assign(emptyVoice(), structuredClone(recipe.character?.voice ?? {}), ...records.filter((binding) => binding!.record.category !== 'pronunciation').map((binding) => binding!.record.values), records.length ? { samples: [] } : {})
  const individual = recipe.settingBindings?.pronunciation?.record.values.pronunciation
  if (individual) voice.pronunciation = [voice.pronunciation, individual].filter(Boolean).join('；')
  return voice
}

export function effectiveCharacter(recipe: RecipeState): CharacterIdentity | null {
  return recipe.character ? { ...recipe.character, world: compositionWorld(recipe), voice: compositionVoice(recipe), settingBindings: structuredClone(recipe.settingBindings ?? {}) } : null
}

export function recipeVoiceTask(recipe: RecipeState) {
  if (!recipe.character?.voice && !Object.values(recipe.settingBindings ?? {}).some((binding) => binding && SETTING_CATEGORIES[binding.record.category].group === 'voice')) return null
  return { ...voiceTask({ id: recipe.character?.id ?? recipe.portrait?.id ?? 'unbound-character', version: recipe.character?.version ?? 1, name: recipe.character?.name ?? recipe.portrait?.标题 ?? '未命名虚构人物', age: recipe.character?.age ?? recipe.portrait?.catalog?.age, gender: recipe.character?.gender ?? recipe.portrait?.catalog?.presentation ?? '', voice: compositionVoice(recipe) }), associations: structuredClone(recipe.settingBindings ?? {}) }
}

export function profileWithSettings(profile: CharacterProfile, bindings: SettingBindings): CharacterProfile {
  const recipe = { character: profile, settingBindings: bindings, portrait: null, costume: null, pose: null }
  const world = compositionWorld(recipe)
  const voice = { ...compositionVoice(recipe), samples: profile.voice?.samples ?? [] }
  const fixed = Object.fromEntries(Object.entries(bindings).map(([key, binding]) => [key, { ...structuredClone(binding!), locked: true }])) as SettingBindings
  return { ...profile, world, voice, settingBindings: fixed, persona: { ...profile.persona, ...(bindings.personality ? { personality: [bindings.personality.record.values.personality] } : {}) } }
}
