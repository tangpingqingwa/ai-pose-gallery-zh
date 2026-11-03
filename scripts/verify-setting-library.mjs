import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { bindingsAfterManualEdit, chooseSetting, compositionVoice, compositionWorld, profileWithSettings, randomSettingBindings, recipeVoiceTask, SETTING_CATEGORIES, validateSettingBindings, validateSettingRecord } from '../src/lib/settingLibrary.ts'
import { buildCodexTask, validateCharacter } from '../src/lib/characters.ts'
import { migrateWhiteReferences, whiteModels } from '../src/lib/whiteModels.ts'
import { asLibraryReference, supplementalReferencePrompt } from '../src/lib/library.ts'
import { recipeBackup } from '../src/lib/recipeImages.ts'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))
const records = read('setting-records')
records.forEach(validateSettingRecord)
assert.equal(new Set(records.map((record) => record.id)).size, records.length)
for (const category of Object.keys(SETTING_CATEGORIES)) assert.ok(records.some((record) => record.category === category), `Empty setting category: ${category}`)
const occupation = records.find((record) => record.category === 'occupation')
const spanish = records.find((record) => record.category === 'language' && record.values.locale === 'es-MX')
const pronunciation = records.find((record) => record.category === 'pronunciation')
let bindings = chooseSetting(chooseSetting({}, occupation), spanish)
const occupationSnapshot = structuredClone(bindings.occupation)
for (let index = 0; index < 20; index++) bindings = randomSettingBindings(records, bindings)
assert.deepEqual(bindings.occupation, occupationSnapshot, 'Random changes must preserve locked selections')
assert.equal(bindings.language.record.id, spanish.id)
assert.equal(Object.keys(bindings).length, Object.keys(SETTING_CATEGORIES).length)
validateSettingBindings(JSON.parse(JSON.stringify(bindings)))
assert.throws(() => validateSettingRecord({ ...occupation, values: { voice: 'wrong field' } }))
assert.throws(() => validateSettingBindings({ occupation: { ...bindings.occupation, record: spanish } }))
const mutable = structuredClone(occupation)
const snapshot = chooseSetting({}, mutable)
mutable.values.occupation = 'Edited library record'
assert.equal(snapshot.occupation.record.values.occupation, occupation.values.occupation, 'Associations keep the selected record snapshot')
const first = chooseSetting(chooseSetting({}, spanish), pronunciation)
const second = chooseSetting(chooseSetting({}, pronunciation), spanish)
const recipe = { portrait: read('catalog-expansion').portraits[0], costume: null, pose: null, settingBindings: bindings, extraImages: [asLibraryReference(whiteModels[0])] }
assert.deepEqual(compositionVoice({ ...recipe, settingBindings: first }), compositionVoice({ ...recipe, settingBindings: second }), 'Pronunciation priority must not depend on click order')
assert.ok(compositionVoice({ ...recipe, settingBindings: first }).pronunciation.includes(pronunciation.values.pronunciation))
assert.ok(compositionVoice({ ...recipe, settingBindings: first }).pronunciation.includes(spanish.values.pronunciation))
assert.equal(compositionWorld(recipe).occupation, occupation.values.occupation)
assert.equal(recipeVoiceTask(recipe).voice.locale, 'es-MX')
const task = buildCodexTask(recipe, 'visual prompt')
assert.equal(task.character, null, 'A record association does not require a pre-existing character archive')
assert.equal(task.voiceDirection.voice.locale, 'es-MX')
assert.deepEqual(task.composition.settingBindings, bindings)
assert.deepEqual(recipeBackup(recipe).settingBindings, bindings)
const profile = structuredClone(read('ip-characters')[0])
profile.voice.samples = [{ id: 'retained-audio', title: 'existing sample', url: '/voice/sample.wav', mimeType: 'audio/wav', createdAt: '2026-11-03T00:00:00Z', transcript: 'sample', generator: 'user' }]
const fixed = profileWithSettings(profile, bindings)
assert.deepEqual(fixed.appearance, profile.appearance)
assert.deepEqual(fixed.body, profile.body)
assert.equal(fixed.voice.samples.length, 1, 'Fixing new settings must not delete existing voice samples')
assert.ok(Object.values(fixed.settingBindings).every((binding) => binding.locked))
validateCharacter(fixed)
const editedVoice = bindingsAfterManualEdit(fixed.settingBindings, 'voice', { ...fixed.voice, timbre: 'A deliberately edited individual voice' })
assert.ok(!editedVoice.timbre && editedVoice.language && editedVoice.occupation, 'Manual edits detach only the changed record association')
const migrated = migrateWhiteReferences([{ id: 'old', source: 'library', referenceKind: 'grooming', role: 'grooming', name: '银发的三种日常梳理', url: '/library-assets/grooming/R-NEW-005.png' }, { id: 'manual', name: 'manual', url: '/manual.png' }])
assert.ok(migrated[0].url.startsWith('/white-models/'))
assert.equal(migrated[0].renderMode, 'white_model')
assert.equal(migrated[1].id, 'manual')
let pngBytes = 0
const assets = read('white-model-assets')
assert.equal(assets.length, whiteModels.length)
assert.equal(new Set(assets.map((asset) => asset.sha256)).size, assets.length)
for (const asset of assets) {
  assert.equal(asset.review, 'reviewed')
  const blob = fs.readFileSync(path.join(root, 'public', asset.url))
  assert.equal(crypto.createHash('sha256').update(blob).digest('hex'), asset.sha256)
  assert.equal(blob.readUInt32BE(16), asset.width)
  assert.ok(fs.existsSync(path.join(root, 'public', asset.thumbnail)))
  pngBytes += blob.length
}
assert.ok(whiteModels.every((record) => record.renderMode === 'white_model' && !record.ownerCharacterId && record.url.startsWith('/white-models/')))
assert.ok(supplementalReferencePrompt(2, asLibraryReference(whiteModels[0])).includes('不复制其五官比例、白色材质'))
console.log(JSON.stringify({ ok: true, records: records.length, categories: Object.keys(SETTING_CATEGORIES).length, whiteModels: whiteModels.length, pngMB: +(pngBytes / 1048576).toFixed(1), checks: 'classification, validation, locked randomization, stable snapshots, locale/voice ordering, archive binding, audio retention, legacy reference migration, image hashes' }))
