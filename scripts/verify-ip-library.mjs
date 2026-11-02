import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { assetFor, buildCodexTask, characterIdentity, detachCharacter, identityPrompt, recipeForCharacter, validateCharacter } from '../src/lib/characters.ts'

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
for (const mutate of [
  (profile) => { profile.age = 17 },
  (profile) => { profile.body.heightCm = Number.NaN },
  (profile) => { profile.assets[1].parentAssetIds = ['missing'] },
  (profile) => { profile.assets[0].parentAssetIds = [profile.assets[1].id] },
  (profile) => { profile.assets[0].url = 'javascript:alert(1)' },
]) {
  const invalid = structuredClone(first)
  mutate(invalid)
  assert.throws(() => validateCharacter(invalid))
}
console.log(JSON.stringify({ ok: true, characters: profiles.length, assets, looks: looks.length, checks: 'manifest files/hashes, catalog IDs, identity snapshots, character switching, Codex export, import validation' }))
