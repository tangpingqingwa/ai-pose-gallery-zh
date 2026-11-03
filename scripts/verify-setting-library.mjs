import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { bindingsAfterManualEdit, chooseSetting, compositionVoice, compositionWorld, profileWithSettings, randomSettingBindings, recipeVoiceTask, SETTING_CATEGORIES, validateSettingBindings, validateSettingRecord } from '../src/lib/settingLibrary.ts'
import { buildCodexTask, validateCharacter } from '../src/lib/characters.ts'
import { migrateWhiteReferences, randomWhiteReferences, whiteModels } from '../src/lib/whiteModels.ts'
import { asLibraryReference, supplementalReferencePrompt } from '../src/lib/library.ts'
import { recipeBackup } from '../src/lib/recipeImages.ts'
import { matchesVoiceFacets, voiceRecordFacets } from '../src/lib/voiceCatalog.ts'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'data', name + '.json'), 'utf8'))
const records = read('setting-records')
records.forEach(validateSettingRecord)
const languageRecords = records.filter((record) => record.category === 'language')
assert.equal(languageRecords.length, 80)
assert.equal(languageRecords.filter((record) => record.values.language === '西班牙语').length, 16)
assert.equal(languageRecords.filter((record) => record.values.language === '英语').length, 17)
for (const record of languageRecords) {
  assert.equal(Intl.getCanonicalLocales(record.values.locale)[0], record.values.locale)
  assert.ok(voiceRecordFacets(record).country.includes(record.values.locale))
  assert.notEqual(voiceRecordFacets(record).region, '其他地区', `Missing region classification for ${record.values.locale}`)
  const chosen = chooseSetting({}, record)
  const randomized = randomSettingBindings(records, chosen, 'voice', () => 0.5)
  assert.equal(randomized.language.record.id, record.id)
  for (const binding of Object.values(randomized)) if (binding.record.localePrefixes?.length) assert.ok(binding.record.localePrefixes.some((prefix) => record.values.locale === prefix || record.values.locale.startsWith(prefix + '-')), 'Random voice companions must fit the chosen language')
}
const mexicanDirections = languageRecords.filter((record) => matchesVoiceFacets(record, { language: '西班牙语', region: '拉丁美洲', country: '墨西哥 · es-MX' }))
assert.equal(mexicanDirections.length, 2, 'City accents sharing one locale must remain separate selectable records')
assert.ok(!matchesVoiceFacets(records.find((record) => record.category === 'timbre'), { language: '英语', region: '', country: '' }))
assert.equal(new Set(languageRecords.map((record) => record.values.sampleText)).size, languageRecords.length, 'Accent directions need individual reading examples')
assert.equal(new Set(records.map((record) => record.id)).size, records.length)
for (const category of Object.keys(SETTING_CATEGORIES)) assert.ok(records.some((record) => record.category === category), `Empty setting category: ${category}`)
const occupation = records.find((record) => record.category === 'occupation')
const japanese = records.find((record) => record.category === 'language' && record.values.locale === 'ja-JP')
const englishHabit = records.find((record) => record.category === 'speechHabits' && record.localePrefixes?.includes('en'))
const timbre = records.find((record) => record.category === 'timbre')
const lockedEnglishHabit = chooseSetting(chooseSetting({}, englishHabit), timbre)
assert.throws(() => chooseSetting(lockedEnglishHabit, japanese), /请先解锁/, 'Locked locale-specific choices must not be silently discarded')
const editableEnglishHabit = structuredClone(lockedEnglishHabit)
editableEnglishHabit.speechHabits.locked = false
const switchedLanguage = chooseSetting(editableEnglishHabit, japanese)
assert.ok(!switchedLanguage.speechHabits && switchedLanguage.language.record.id === japanese.id)
assert.deepEqual(switchedLanguage.timbre, lockedEnglishHabit.timbre, 'Language switching retains independent voice texture')
assert.throws(() => chooseSetting(switchedLanguage, englishHabit), /不适配当前语言/)
assert.throws(() => chooseSetting({}, englishHabit, 'ja-JP'), /不适配当前语言/, 'Character base language participates in explicit association validation')
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
const removed = ['expressions', 'body-details', 'mannerisms'].map((kind, index) => ({ id: `retired-${index}`, source: 'library', referenceKind: kind, renderMode: 'white_model', name: 'removed library reference', url: `/white-models/${kind}/retired.png` }))
const cleaned = migrateWhiteReferences([...removed, { id: 'manual-anchor', role: 'character_body', name: 'own identity body', url: '/own-body.png' }, ...migrated])
assert.equal(cleaned.length, 3)
assert.ok(!cleaned.some((image) => image.id.startsWith('retired-')))
assert.ok(cleaned.some((image) => image.id === 'manual-anchor'))
assert.ok(whiteModels.every((image) => image.kind === 'grooming'))
const randomizedReferences = randomWhiteReferences(recipe)
assert.ok(randomizedReferences.filter((image) => image.source === 'library').every((image) => image.referenceKind === 'grooming'))
for (const route of ['expressions', 'body-details', 'mannerisms']) assert.ok(!fs.existsSync(path.join(root, 'src/routes', route + '.tsx')))

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
