import type { CharacterIdentity, CharacterVoice } from '@/types/character'

export const VOICE_FIELDS = { language: '主要语言', locale: '语言地区标记', dialect: '方言或地区变体', secondaryLanguages: '其他语言、熟练度与切换习惯', accent: '口音设定', accentStrength: '口音强弱', timbre: '音色与质感', pitch: '音高范围', pace: '语速与停顿', prosody: '语调与重音', speechHabits: '惯用表达与口头习惯', pronunciation: '发音细节与姓名读法', avoid: '避免的声音特征', sampleText: '固定试读文本' } as const

export const VOICE_PRESETS = [
  { id: 'es-MX', label: '西语 · 墨西哥中部', language: '西班牙语', locale: 'es-MX', dialect: '墨西哥中部西语', accent: '自然、轻度墨西哥中部西语口音', pronunciation: '采用墨西哥中部日常西语发音与用词；外来词说清楚，不夸张表演。', sampleText: 'Esta mañana olvidé mi libreta en casa. Dame un momento; quiero revisar las notas antes de empezar.' },
  { id: 'es-ES', label: '西语 · 西班牙中北部', language: '西班牙语', locale: 'es-ES', dialect: '西班牙中北部西语', accent: '自然、轻度西班牙中北部西语口音', pronunciation: '采用西班牙中北部西语发音与用词，保持自然交流，避免戏剧化。', sampleText: 'Esta mañana he dejado mi cuaderno en casa. Espera un momento; quiero comprobar las notas antes de empezar.' },
  { id: 'es-AR', label: '西语 · 拉普拉塔', language: '西班牙语', locale: 'es-AR', dialect: '阿根廷拉普拉塔西语', accent: '自然、轻度拉普拉塔西语口音', pronunciation: '使用自然的拉普拉塔西语节奏和 voseo 表达；不要夸张模仿。', sampleText: 'Esta mañana me olvidé la libreta en casa. ¿Me esperás un momento? Quiero revisar las notas antes de empezar.' },
  { id: 'es-CO', label: '西语 · 哥伦比亚波哥大', language: '西班牙语', locale: 'es-CO', dialect: '哥伦比亚波哥大西语', accent: '自然、轻度波哥大西语口音', pronunciation: '以波哥大地区日常西语为创作方向，清楚、克制，不宣称覆盖整个国家。', sampleText: 'Esta mañana dejé mi cuaderno en la casa. Un momento, por favor; quiero revisar las notas antes de empezar.' },
  { id: 'en-IE', label: '英语 · 都柏林', language: '英语', locale: 'en-IE', dialect: '爱尔兰都柏林英语', accent: '自然、轻度都柏林英语口音', pronunciation: '清楚说出专有名词，不夸张表演地域口音。', sampleText: 'Give me a moment. I want to check my notes before we start.' },
  { id: 'fr-FR', label: '法语 · 法国', language: '法语', locale: 'fr-FR', dialect: '法国法语，具体地区可另填', accent: '自然、轻度法国法语口音', pronunciation: '连读与姓名读法清楚自然，具体地区和个人差异另行填写。', sampleText: 'Attends un instant. Je voudrais vérifier mes notes avant de commencer.' },
] as const

export function emptyVoice(): CharacterVoice {
  return { language: '', locale: '', dialect: '', secondaryLanguages: '', accent: '', accentStrength: '轻度、自然', timbre: '', pitch: '', pace: '', prosody: '', speechHabits: '', pronunciation: '', avoid: '', sampleText: '', samples: [] }
}

export function voiceTask(profile: CharacterIdentity) {
  const voice = profile.voice ?? emptyVoice()
  return { schemaVersion: 1, kind: 'voice_direction', characterId: profile.id, characterVersion: profile.version,
    instruction: '为原创虚构成年角色生成原创声音；按语言、口音和声线设定保持一致。此文件是配音任务描述，不是已生成的音频。',
    voice: Object.fromEntries(Object.keys(VOICE_FIELDS).map((key) => [key, voice[key as keyof typeof VOICE_FIELDS]])),
    prompt: [`角色：${profile.name}，${profile.age} 岁成年${profile.gender}。`, ...Object.entries(VOICE_FIELDS).map(([key, label]) => `${label}：${voice[key as keyof typeof VOICE_FIELDS]}`), '保持同一声线；情绪允许变化，口音强弱、基本音色和惯用节奏保持稳定。不模仿具名真人或明星。'].join('\n'),
  }
}

export function validateVoice(voice: CharacterVoice) {
  if (!voice || typeof voice !== 'object') throw new Error('声音档案必须为对象')
  for (const key of Object.keys(VOICE_FIELDS) as (keyof typeof VOICE_FIELDS)[]) if (typeof voice[key] !== 'string') throw new Error(`声音字段无效：${VOICE_FIELDS[key]}`)
  if (!Array.isArray(voice.samples) || voice.samples.length > 100) throw new Error('声音样本清单无效')
  const ids = new Set<string>()
  for (const sample of voice.samples) {
    if (!sample || typeof sample.id !== 'string' || ids.has(sample.id) || typeof sample.url !== 'string' || !/^(\/[^/]|https:\/\/|data:audio\/[\w.+-]+;base64,)/.test(sample.url)) throw new Error('声音样本编号或地址无效')
    ids.add(sample.id)
    for (const key of ['title', 'mimeType', 'createdAt', 'transcript', 'generator'] as const) if (typeof sample[key] !== 'string') throw new Error('声音样本来源不完整')
  }
}
