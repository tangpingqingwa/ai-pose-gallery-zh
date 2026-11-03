import type { CostumeClassification, CostumeItem, ExtraReferenceImage, PortraitClassification, PortraitItem, VisualReferenceItem, VisualReferenceKind } from '@/types/gallery'

export const REFERENCE_LIBRARIES = {
  expressions: { title: '表情神态库', short: '表情', route: '/expressions', description: '选择情绪、眼神与口形，保留当前人物身份。', role: 'expression' },
  grooming: { title: '妆发状态库', short: '妆发', route: '/grooming', description: '日常整理、妆容与胡须状态，保留五官和年龄。', role: 'grooming' },
  'body-details': { title: '体型细节库', short: '体型/细节', route: '/body-details', description: '成年体型、侧貌、皮肤和手部，记录个体差异。', role: 'body_guide' },
  mannerisms: { title: '习惯仪态库', short: '仪态', route: '/mannerisms', description: '倾听、思考和放松时的自然习惯动作。', role: 'gesture' },
} as const

export function ageBand(age: number) {
  return age < 30 ? '18–29' : age < 45 ? '30–44' : age < 60 ? '45–59' : '60+'
}

export function portraitClassification(item: PortraitItem): PortraitClassification {
  return item.catalog ?? { collection: 'original', ageBand: '原库未标注', presentation: '原库未标注', skinTone: '原库未标注', bodyDesign: '原库未标注', market: '原库未标注', appearance: item.发型名称, annotation: 'source_metadata' }
}

export function portraitHairFamily(item: PortraitItem) {
  const name = item.发型名称
  if (name === '标准基础款') return '基础款/未细分'
  if (/波波头/.test(name)) return '波波头'
  if (/狼尾/.test(name)) return '狼尾/层次'
  if (/盘发|丸子|发髻/.test(name)) return '盘发/发髻'
  if (/马尾|编发|辫/.test(name)) return '扎发/编发'
  if (/卷|波浪/.test(name)) return '卷发/波浪'
  if (/直发|一刀切/.test(name)) return '直发'
  return '其他明确发型'
}

export function portraitFringe(item: PortraitItem) {
  const name = item.发型名称
  return ['无刘海', '空气刘海', '八字侧刘海', '八字刘海', '齐刘海', '侧刘海', '长刘海'].find((term) => name.includes(term)) ?? '未标注刘海'
}

export function costumeClassification(item: CostumeItem): CostumeClassification {
  if (item.catalog) return item.catalog
  const tags = item.标签.join(' ')
  const structure = /连衣裙|半身裙/.test(tags) ? '裙装搭配' : /长裤|短裤|牛仔裤/.test(tags) ? '裤装搭配' : /文胸|内裤|束腰胸衣/.test(tags) ? '内衣搭配' : '其他搭配'
  const occasion = item.分类 === '派对・礼服' ? '正式场合' : item.分类 === '泳装・度假' ? '度假休闲' : item.分类 === '内衣・睡衣' ? '内衣睡衣' : item.分类 === '性感穿搭' ? '主题造型' : '季节时尚'
  const season = ({ '春季穿搭': '春季', '夏季穿搭': '夏季', '秋季穿搭': '秋季', '冬季穿搭': '冬季' } as Record<string, string>)[item.分类] ?? '未标注季节'
  return { collection: 'original', cut: '原库未标注', occasion, fit: '原库未标注', season, stage: '原库未标注', structure, annotation: 'source_metadata' }
}

export function asLibraryReference(item: VisualReferenceItem, instruction = item.instruction): ExtraReferenceImage {
  return { id: `library:${item.id}`, role: item.role, source: 'library', referenceKind: item.kind, referenceId: item.id, name: item.title, url: item.url, thumbnail: item.thumbnail, instruction }
}

export function withLibraryReference(previous: ExtraReferenceImage[], item: VisualReferenceItem, instruction?: string) {
  const reference = asLibraryReference(item, instruction)
  // A selected sheet occupies its actual role, preserving manual uploads and identity anchors.
  return [...previous.filter((entry) => entry.id !== reference.id && !(entry.source === 'library' && entry.referenceKind === item.kind && entry.role === item.role)), reference]
}

export function referenceIsSelected(images: ExtraReferenceImage[] | undefined, item: VisualReferenceItem) {
  return Boolean(images?.some((entry) => entry.referenceId === item.id && entry.source === 'library'))
}

export function libraryKindForRole(role: ExtraReferenceImage['role']): VisualReferenceKind | undefined {
  if (role === 'expression') return 'expressions'
  if (role === 'grooming') return 'grooming'
  if (role === 'identity_detail' || role === 'body_guide' || role === 'character_body') return 'body-details'
  if (role === 'gesture') return 'mannerisms'
}

export function supplementalReferencePrompt(index: number, image: ExtraReferenceImage): string {
  const purpose: Partial<Record<NonNullable<ExtraReferenceImage['role']>, string>> = {
    expression: '表情神态：仅取眼神、眉眼与口形变化，人物五官、肤色和年龄以当前人像为准。',
    grooming: '妆发状态：仅取妆容、发型整理或胡须状态，保留当前人物的面部结构、年龄和发色。',
    body_guide: '体型与体态：设计新人物时参考轮廓与比例；已有角色母版时以该角色设定为准。不能复制参考人物的身份或多视图排版。',
    gesture: '习惯仪态：在所选整体姿势中融合自然手势、视线与肩颈状态；冲突时保持整体姿势与人体合理性，不替换当前人物身份和穿搭。',
    identity_detail: image.source === 'library' ? '人物细节：参考纹理和细节表现，保持当前人像五官，不借用另一人的脸，不复制多格排版。' : '人物细节：固定该角色的五官、皮肤与手部细节，不复制多格布局、背景或参考图表情。',
    character_body: '全身体型母版：固定该角色的肩腰臀、体态与成年比例，不把多个视图复制为多个角色。',
    prop: '随身特征：只取所需物件，人物为主，不复制陈列布局或额外物品。',
    wardrobe_detail: '衣橱细节：只取穿着细节，不复制人台比例或背景。',
  }
  return `• 图${index}（${image.name || '补充参考'}）：${purpose[image.role ?? 'character_sheet'] ?? '按本次任务使用对应元素。'}${image.instruction ? `本次参考目标：${image.instruction}` : ''}`
}
