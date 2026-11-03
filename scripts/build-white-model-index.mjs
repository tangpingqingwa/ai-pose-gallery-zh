import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))
const specs = read('white-model-generation-specs')
const manifestPath = path.join(root, 'data/white-model-assets.json')
const previous = fs.existsSync(manifestPath) ? read('white-model-assets') : []
const accepted = process.argv.includes('--accept-visual-review')
const assets = specs.map((spec) => {
  const scratch = path.join(root, 'backups/white-model-records', spec.id + '.json')
  const asset = fs.existsSync(scratch) ? JSON.parse(fs.readFileSync(scratch, 'utf8')) : previous.find((item) => item.id === spec.id)
  if (!asset) throw new Error(`Missing white model: ${spec.id}`)
  const bytes = fs.readFileSync(path.join(root, 'public', asset.url))
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error(`White model changed: ${spec.id}`)
  return { ...asset, review: accepted ? 'reviewed' : previous.find((item) => item.id === spec.id)?.review ?? 'pending_visual_review' }
})
const references = specs.map((spec, index) => ({ ...assets[index], kind: spec.kind, title: spec.title, feature: spec.feature, description: spec.description, role: spec.role, instruction: spec.instruction, renderMode: 'white_model', presentation: '通用', ageBand: '成年', skinTone: '不适用', tags: [spec.feature, '成年', '白模'], origin: 'white_model' }))
fs.writeFileSync(manifestPath, JSON.stringify(assets, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'data/white-model-references.json'), JSON.stringify(references, null, 2) + '\n')
console.log(JSON.stringify({ whiteModels: assets.length, review: accepted ? 'reviewed' : 'pending_visual_review' }))
