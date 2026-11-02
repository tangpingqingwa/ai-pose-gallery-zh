import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { assetFor, buildCodexTask, characterIdentity, detachCharacter, identityPrompt, mergeCharacterProfile, recipeForCharacter, validateCharacter } from '../src/lib/characters.ts'
import { applyCharacterBrief, emptyBrief, validateBrief, worldPrompt } from '../src/lib/characterWorld.ts'
import { VOICE_PRESETS, voiceTask } from '../src/lib/characterVoice.ts'
import { costumeDescriptionGroups, matchesCatalog } from '../src/lib/catalog.ts'

const root = path.resolve(import.meta.dirname, '..')
const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data/ip-characters.json'), 'utf8'))
const looks = JSON.parse(fs.readFileSync(path.join(root, 'data/ip-looks.json'), 'utf8'))
const costumes = JSON.parse(fs.readFileSync(path.join(root, 'data/costume-zh.json'), 'utf8'))
const poses = JSON.parse(fs.readFileSync(path.join(root, 'data/pose-zh.json'), 'utf8'))
assert.equal(new Set(profiles.map((profile) => profile.id)).size, profiles.length, 'Character IDs must be unique')
assert.equal(new Set(profiles.map((profile) => profile.appearance.bodyType)).size, profiles.length, 'Seed body types must be distinct')
let assets = 0
for (const profile of profiles) {
  validateCharacter(profile)
  for (const kind of ['portrait', 'turnaround', 'expressions']) assert.ok(assetFor(profile, kind), `${profile.id}: missing ${kind}`)
  for (const asset of profile.assets) {
    const file = path.resolve(root, 'public', '.' + asset.url)
    assert.ok(file.startsWith(path.join(root, 'public') + path.sep))
    const bytes = fs.readFileSync(file)
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, `Hash mismatch: ${asset.id}`)
    assert.equal(bytes.readUInt32BE(16), asset.width)
    assert.equal(bytes.readUInt32BE(20), asset.height)
    assets++
  }
}
for (const look of looks) {
  assert.ok(profiles.some((profile) => profile.id === look.characterId), 'Look must reference a character')
  assert.ok(!look.costumeId || costumes.some((costume) => costume.id === look.costumeId), `Unknown outfit: ${look.costumeId}`)
  assert.ok(poses.some((pose) => pose.id === look.poseId), `Unknown pose: ${look.poseId}`)
  assert.ok(profiles.find((profile) => profile.id === look.characterId).assets.some((asset) => asset.composition?.lookId === look.id), `Missing generated look: ${look.id}`)
}
const first = profiles[0]
const selected = recipeForCharacter(first, { portrait: null, costume: null, pose: null, extraImages: [{ id: 'manual', name: 'manual', url: '/manual.png' }] })
assert.equal(selected.character.id, first.id)
assert.equal(selected.portrait.id, `character:${first.id}`)
assert.ok(selected.extraImages.some((reference) => reference.role === 'character_body'))
const second = recipeForCharacter(profiles[1], selected)
assert.equal(second.extraImages.filter((reference) => reference.role === 'character_body').length, 1, 'Switching characters must remove the previous body anchor')
assert.ok(second.extraImages.find((reference) => reference.role === 'character_body').url.includes(profiles[1].slug))
assert.ok(second.extraImages.some((reference) => reference.id === 'manual'), 'Manual references must survive')
const detached = detachCharacter(second)
assert.equal(detached.character, null)
assert.ok(!detached.extraImages.some((reference) => reference.role === 'character_body'))
const originalHeight = first.body.heightCm
selected.character.body.heightCm = 199
assert.equal(first.body.heightCm, originalHeight, 'Recipe identity must be an immutable snapshot')
assert.ok(identityPrompt(characterIdentity(first)).includes('设计目标'))
const task = buildCodexTask(second, 'test')
assert.equal(task.references[0].role, 'identity')
assert.equal(task.references.at(-1).role, 'character_body')
assert.ok(!JSON.stringify(task).includes('apiKey'), 'Codex exports must not contain provider credentials')
const workflowTask = buildCodexTask(second, 'workflow test', [
  { id: 'lighting', name: 'Lighting', url: '/lighting.png' },
  { id: 'sheet', role: 'character_sheet', name: 'Sheet', url: '/sheet.png' },
])
assert.deepEqual(workflowTask.references.map((reference) => reference.url), ['/sheet.png', second.portrait.原图, '/lighting.png', '/manual.png', second.extraImages.at(-1).url], 'Exported image order must match prompt numbering including workflow references')
const event = first.world.events[1]
const brief = { ...emptyBrief(), eventId: event.id, wardrobeId: event.wardrobeId, belongingIds: event.belongingIds, action: '倾听时拢发', emotion: '放松而略疲惫', grooming: '日常淡妆' }
const personal = applyCharacterBrief(recipeForCharacter(first, selected), first, brief)
assert.equal(personal.costume, null, 'Daily wardrobe must not conflict with gallery outfit')
assert.equal(personal.pose, null, 'Personal habit replaces mannequin pose')
assert.ok(personal.extraImages.some((reference) => reference.role === 'identity_detail'))
assert.ok(worldPrompt(personal.character, personal.creativeBrief).includes(event.consequence))
assert.ok(worldPrompt(personal.character, personal.creativeBrief).includes('背景简洁'))
assert.ok(!recipeForCharacter(profiles[1], personal).extraImages.some((reference) => reference.source === 'character_world'), 'Changing identity must clear previous personal detail')
assert.ok(!detachCharacter(personal).creativeBrief)
assert.throws(() => validateBrief(first.world, { ...brief, belongingIds: ['missing'] }))
const old = structuredClone(first)
old.world = undefined
old.voice = undefined
old.assets = old.assets.slice(0, 3)
old.body.heightCm = 171
const merged = mergeCharacterProfile(first, old)
assert.equal(merged.body.heightCm, 171, 'Library upgrade must preserve local body edits')
assert.equal(merged.assets.length, first.assets.length, 'Library upgrade must include newly shipped assets')
assert.equal(merged.voice.locale, first.voice.locale)
const withAudio = structuredClone(first)
withAudio.voice.samples = [{ id: 'sample', title: 'sample', url: 'data:audio/wav;base64,AA==', mimeType: 'audio/wav', createdAt: '2026-11-02', transcript: '', generator: 'test' }]
assert.equal(characterIdentity(withAudio).voice.samples.length, 0, 'Image recipes must not embed audio payloads')
assert.equal(voiceTask(profiles[2]).voice.locale, 'es-MX')
assert.ok(voiceTask(profiles[2]).prompt.includes('墨西哥中部'))
assert.ok(['es-MX', 'es-ES', 'es-AR', 'es-CO'].every((id) => VOICE_PRESETS.some((preset) => preset.id === id)))
assert.equal(costumeDescriptionGroups(costumes).size, 1250)
assert.ok(matchesCatalog('藏青色 knit olive green denim pants', 'denim 藏青色'))
assert.ok(!matchesCatalog('藏青色 knit olive green denim pants', 'denim 红色'))
for (const mutate of [
  (profile) => { profile.age = 17 },
  (profile) => { profile.body.heightCm = Number.NaN },
  (profile) => { profile.assets[1].parentAssetIds = ['missing'] },
  (profile) => { profile.assets[0].parentAssetIds = [profile.assets[1].id] },
  (profile) => { profile.assets[0].url = 'javascript:alert(1)' },
  (profile) => { profile.world.events[0].belongingIds = ['missing'] },
  (profile) => { profile.world.events[0].date = '2026-02-31' },
  (profile) => { profile.voice.locale = 123 },
  (profile) => { profile.voice.samples = [{ id: 'bad', url: 'javascript:alert(1)' }] },
]) {
  const invalid = structuredClone(first)
  mutate(invalid)
  assert.throws(() => validateCharacter(invalid))
}
console.log(JSON.stringify({ ok: true, characters: profiles.length, assets, looks: looks.length, voiceProfiles: profiles.filter((profile) => profile.voice).length, checks: 'file integrity, catalog grouping/search, role switching, personal-state continuity, local migration, Spanish voice tasks, invalid imports' }))
