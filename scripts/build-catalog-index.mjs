import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { interleaveCatalog } from '../src/lib/catalog.ts'

const root = path.resolve(import.meta.dirname, '..')
const specs = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog-generation-specs.json'), 'utf8'))
const manifestPath = path.join(root, 'data/catalog-assets.json')
const existing = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : []
const records = specs.map((spec) => {
  const scratch = path.join(root, 'backups/catalog-render-records', spec.id + '.json')
  const record = fs.existsSync(scratch) ? JSON.parse(fs.readFileSync(scratch, 'utf8')) : existing.find((asset) => asset.id === spec.id)
  if (!record) throw new Error(`Missing image record: ${spec.id}`)
  return record
})
const byId = new Map(records.map((record) => [record.id, record]))
for (const record of records) {
  const file = path.join(root, 'public', record.url)
  const bytes = fs.readFileSync(file)
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error(`Image changed: ${record.id}`)
  if (!fs.existsSync(path.join(root, 'public', record.thumbnail))) throw new Error(`Missing preview: ${record.id}`)
}
const accepted = process.argv.includes('--accept-visual-review')
const review = accepted ? 'reviewed' : 'pending_visual_review'
const portraits = specs.filter((item) => item.kind === 'portraits').map((spec) => {
  const image = byId.get(spec.id)
  return { id: spec.id, source: 'catalog', 分区: '多样人像', 发长: spec.hairLength, 发型名称: `${spec.name} · ${spec.hairLength}`, 标题: spec.title, 宽: image.width, 高: image.height, 字节数: image.bytes, 精选: false, 热门: false, 缩略图: image.thumbnail, 原图: image.url,
    检索: [spec.id, spec.name, spec.title, spec.description, spec.ageBand, spec.presentation, spec.skinTone, spec.bodyDesign, spec.market].join(' '),
    catalog: { collection: 'expanded', age: spec.age, ageBand: spec.ageBand, presentation: spec.presentation, skinTone: spec.skinTone, bodyDesign: spec.bodyDesign, market: spec.market, appearance: spec.description, ...(spec.faceShape ? { faceShape: spec.faceShape } : {}), ...(spec.facialHair ? { facialHair: spec.facialHair } : {}), annotation: 'design_spec' },
  }
})
// New groups and later batches must remain browsable; never index a fixed 16-row list.
const orderedPortraits = interleaveCatalog([...portraits.filter((item) => specs.find((spec) => spec.id === item.id)?.batch), ...portraits.filter((item) => !specs.find((spec) => spec.id === item.id)?.batch)], (item) => `${item.catalog.presentation}:${item.catalog.ageBand}`)
const costumes = specs.filter((item) => item.kind === 'costumes').map((spec) => {
  const image = byId.get(spec.id)
  return { id: spec.id, source: 'catalog', 分类: spec.occasion, 服装名称: spec.title, 标签: [spec.cut, spec.occasion, spec.fit, spec.season, spec.stage], 关键词: spec.english, 缩略图: image.thumbnail, 预览图: image.url, 原图: image.url, 检索: [spec.id, spec.title, spec.description, spec.english, spec.cut, spec.occasion, spec.fit, spec.stage, spec.season].join(' '),
    catalog: { collection: 'expanded', cut: spec.cut, occasion: spec.occasion, fit: spec.fit, season: spec.season, stage: spec.stage, structure: spec.structure ?? (/裙/.test(spec.description) ? '裙装搭配' : '裤装搭配'), ...(spec.ageBands ? { ageBands: spec.ageBands } : {}), annotation: 'design_spec' },
  }
})
const orderedCostumes = interleaveCatalog([...costumes.filter((item) => specs.find((spec) => spec.id === item.id)?.batch), ...costumes.filter((item) => !specs.find((spec) => spec.id === item.id)?.batch)], (item) => `${item.catalog.cut}:${item.catalog.stage}`)
const roles = { expressions: 'expression', grooming: 'grooming', mannerisms: 'gesture' }
const directions = {
  expressions: '仅借鉴参考图的眼神、口形与情绪肌肉变化，保持当前人像的五官、年龄和肤色；不复制参考人物的脸或多格排版。',
  grooming: '仅借鉴发型整理、妆容或胡须状态，保持当前人像的五官、年龄、发色与皮肤纹理；不复制参考人物的脸，不自动减龄。',
  'body-details': '设计新人物时参考体型轮廓或自然细节；已绑定人物时以当前人物的母版、年龄和身材设定为准，不借用另一人的五官，也不复制多视图排版。',
  mannerisms: '仅借鉴参考图的自然手势、肩颈姿态和视线，不更换当前人像的身份或衣服；画面保持单人。',
}
const references = specs.filter((spec) => !['portraits', 'costumes'].includes(spec.kind)).map((spec) => {
  const image = byId.get(spec.id)
  return { id: spec.id, kind: spec.kind, title: spec.title, feature: spec.feature, description: spec.descriptionZh ?? spec.description, presentation: spec.presentation, ageBand: spec.ageBand, skinTone: spec.skinTone, url: image.url, thumbnail: image.thumbnail, width: image.width, height: image.height,
    role: spec.kind === 'body-details' ? spec.feature === '体型' ? 'body_guide' : 'identity_detail' : roles[spec.kind], instruction: `目标：${spec.title}。${directions[spec.kind]}`, tags: [spec.feature, spec.ageBand, spec.presentation, spec.skinTone], origin: 'project_generated' }
})
const previewPath = path.join(root, 'backups/catalog-seed-previews.json')
const expansionPath = path.join(root, 'data/catalog-expansion.json')
const seedPreviews = fs.existsSync(previewPath) ? JSON.parse(fs.readFileSync(previewPath, 'utf8')) : fs.existsSync(expansionPath) ? JSON.parse(fs.readFileSync(expansionPath, 'utf8')).seedPreviews ?? {} : {}
fs.writeFileSync(path.join(root, 'data/catalog-expansion.json'), JSON.stringify({ schemaVersion: 1, portraits: orderedPortraits, costumes: orderedCostumes, references, seedPreviews }, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'data/catalog-assets.json'), JSON.stringify(records.map((record) => ({ ...record, review: accepted ? review : existing.find((asset) => asset.id === record.id)?.review ?? review })), null, 2) + '\n')
console.log(JSON.stringify({ images: records.length, portraits: portraits.length, costumes: costumes.length, referenceImages: references.length, review }))
