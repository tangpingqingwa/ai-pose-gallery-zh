import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { asLibraryReference, costumeClassification, portraitClassification, portraitHairFamily, portraitFringe, REFERENCE_LIBRARIES, supplementalReferencePrompt, withLibraryReference } from '../src/lib/library.ts'
import { characterVisualReferences } from '../src/lib/visualReferences.ts'
import { buildCodexTask } from '../src/lib/characters.ts'
import { recipeBackup } from '../src/lib/recipeImages.ts'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))
const catalog = read('catalog-expansion')
const specs = read('catalog-generation-specs')
const assets = read('catalog-assets')
const profiles = read('ip-characters')
const oldPortraits = read('portrait-zh')
const oldCostumes = read('costume-zh')
const allRefs = [...catalog.references, ...characterVisualReferences(profiles, catalog.seedPreviews)]
assert.equal(assets.length, specs.length)
assert.equal(new Set(assets.map((asset) => asset.id)).size, assets.length)
assert.equal(new Set(assets.map((asset) => asset.sha256)).size, assets.length, 'New image records must not reuse one image as different assets')
let pngBytes = 0, previewBytes = 0
for (const asset of assets) {
  assert.equal(asset.review, 'reviewed', `Review incomplete: ${asset.id}`)
  const filename = path.resolve(root, 'public', '.' + asset.url)
  assert.ok(filename.startsWith(path.join(root, 'public/library-assets') + path.sep))
  const bytes = fs.readFileSync(filename)
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256)
  assert.equal(bytes.readUInt32BE(16), asset.width)
  assert.equal(bytes.readUInt32BE(20), asset.height)
  const preview = fs.readFileSync(path.join(root, 'public', asset.thumbnail))
  assert.equal(preview.subarray(0, 4).toString(), 'RIFF')
  assert.equal(preview.subarray(8, 12).toString(), 'WEBP')
  assert.ok(preview.length < 200000, 'Browsing preview should be lightweight')
  pngBytes += bytes.length; previewBytes += preview.length
}
assert.ok(catalog.portraits.length >= 16 && catalog.costumes.length >= 16)
for (const age of ['18–29', '30–44', '45–59', '60+']) assert.ok(catalog.portraits.some((item) => item.catalog.ageBand === age))
for (const presentation of ['男性', '女性', '中性形象']) assert.ok(catalog.portraits.some((item) => item.catalog.presentation === presentation))
for (const cut of ['男款', '女款', '中性']) assert.ok(catalog.costumes.some((item) => item.catalog.cut === cut))
for (const occasion of ['通勤商务', '职业工作', '运动活动', '成熟日常', '居家生活', '户外活动']) assert.ok(catalog.costumes.some((item) => item.catalog.occasion === occasion))
for (const kind of Object.keys(REFERENCE_LIBRARIES)) assert.ok(allRefs.some((item) => item.kind === kind), `Empty library: ${kind}`)
for (const item of [...catalog.portraits, ...catalog.costumes]) assert.ok(assets.some((asset) => asset.id === item.id))
for (const item of allRefs) {
  assert.ok(fs.existsSync(path.join(root, 'public', item.url)))
  assert.ok(fs.existsSync(path.join(root, 'public', item.thumbnail)))
  assert.ok(item.instruction && item.role && item.kind)
}
for (const thumbnail of Object.values(catalog.seedPreviews)) assert.ok(fs.existsSync(path.join(root, 'public', thumbnail)))
assert.ok(oldPortraits.every((item) => portraitClassification(item).annotation === 'source_metadata'))
assert.ok(oldPortraits.every((item) => portraitClassification(item).ageBand === '原库未标注'), 'Do not invent demographic labels for the old collection')
assert.ok(oldCostumes.every((item) => costumeClassification(item).structure))
assert.ok(oldPortraits.some((item) => portraitHairFamily(item) === '波波头'))
assert.ok(oldPortraits.some((item) => portraitFringe(item) === '空气刘海'))
const recipe = { portrait: catalog.portraits[0], costume: catalog.costumes[0], pose: read('pose-zh')[0], extraImages: [] }
for (const kind of Object.keys(REFERENCE_LIBRARIES)) recipe.extraImages = withLibraryReference(recipe.extraImages, catalog.references.find((item) => item.kind === kind))
assert.equal(recipe.extraImages.length, 4)
const expression = catalog.references.find((item) => item.kind === 'expressions')
const updated = withLibraryReference(recipe.extraImages, expression, '自然、不夸张')
assert.equal(updated.length, 4)
assert.equal(updated.find((image) => image.referenceId === expression.id).instruction, '自然、不夸张')
const withManual = withLibraryReference([{ id: 'manual', name: 'manual', url: '/manual.png' }, { id: 'body-anchor', role: 'character_body', name: 'body', url: '/body.png' }], expression)
assert.ok(withManual.some((image) => image.id === 'manual') && withManual.some((image) => image.id === 'body-anchor'))
const task = buildCodexTask(recipe, 'test')
assert.deepEqual(task.references.map((ref) => ref.role), ['identity', 'outfit', 'pose', 'expression', 'grooming', 'body_guide', 'gesture'])
assert.ok(task.references.slice(3).every((ref) => ref.instruction && ref.referenceId))
assert.equal(task.inputPlan.mode, 'identity_and_sheet')
assert.equal(task.inputPlan.identityReferenceIndex, 0)
assert.equal(task.inputPlan.sheetReferenceIndices.length, 6)
assert.ok(!task.inputPlan.sheetReferenceIndices.includes(0))
assert.equal(recipeBackup(recipe).extraImages.length, 4, 'URL-backed library references must survive the lightweight fallback')
assert.ok(supplementalReferencePrompt(4, asLibraryReference(expression)).includes('图4'))
assert.ok(supplementalReferencePrompt(4, asLibraryReference(expression)).includes('五官'))
const demo = read('library-demo-task')
assert.equal(demo.references.length, 7)
assert.equal(demo.inputAttachments.length, 2)
assert.equal(demo.inputPlan.mode, 'identity_and_sheet')
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'public', demo.result.url))).digest('hex'), demo.result.sha256)
assert.ok(demo.prompt.includes('Physical attachment 1'))
console.log(JSON.stringify({ ok: true, newImages: assets.length, portraitImages: catalog.portraits.length, outfits: catalog.costumes.length, referenceGroups: allRefs.length, libraries: 7, pngMB: +(pngBytes / 1048576).toFixed(1), previewMB: +(previewBytes / 1048576).toFixed(2), checks: 'files/hashes, distinct images, classifications, all library routes, role-bound composition, reference targets, persistence' }))
