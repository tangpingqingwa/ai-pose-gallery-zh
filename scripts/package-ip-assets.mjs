import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(import.meta.dirname, '..')
const sourceFile = process.argv[2]
if (!sourceFile) throw new Error('Usage: node scripts/package-ip-assets.mjs <source-map.json>')
const sources = JSON.parse(fs.readFileSync(path.resolve(sourceFile), 'utf8'))
const profilePath = path.join(root, 'data/ip-characters.json')
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
for (const item of sources) {
  if (!item.source) throw new Error(`Missing generated file: ${item.slug}/${item.kind}`)
  const profile = profiles.find((profile) => profile.id === item.characterId)
  if (!profile) throw new Error(`Unknown character: ${item.characterId}`)
  const filename = item.filename ?? item.look?.id ?? item.kind
  if (!/^[\w-]+$/.test(filename)) throw new Error('Asset filename must be a plain identifier')
  const destination = path.join(root, 'public/ip-assets', profile.slug, `${filename}.png`)
  if (!destination.startsWith(path.join(root, 'public/ip-assets') + path.sep)) throw new Error('Destination must stay inside public/ip-assets')
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const bytes = fs.readFileSync(item.source)
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Generated asset is not PNG')
  fs.writeFileSync(destination, bytes)
  const id = `${profile.id}-${filename}-v1`
  const names = { portrait: '正脸母版', turnaround: '全身三视角', expressions: '四种自然表情' }
  const asset = {
    id, kind: item.kind, title: item.title ?? item.look?.title ?? names[item.kind], url: `/ip-assets/${profile.slug}/${filename}.png`,
    parentAssetIds: item.parentAssetIds ?? (item.kind === 'portrait' ? [] : item.kind === 'lifestyle' ? [`${profile.id}-portrait-v1`, `${profile.id}-turnaround-v1`] : [`${profile.id}-portrait-v1`]),
    createdAt: '2026-11-02', generator: 'Codex 内置生图', prompt: item.prompt,
    review: 'reviewed', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    characterVersion: profile.version,
    ...(item.binding ? { binding: item.binding } : {}),
    ...(item.composition ? { composition: item.composition } : {}),
    ...(item.sourceReferenceUrls ? { sourceReferenceUrls: item.sourceReferenceUrls } : {}),
    ...(item.look ? { composition: { lookId: item.look.id, costumeId: item.look.costumeId, poseId: item.look.poseId, scene: item.look.scene, customOutfit: item.look.customOutfit }, sourceReferenceUrls: [
      `/ip-assets/${profile.slug}/portrait.png`,
      ...(item.look.costumeId ? [`/img/costume/${item.look.costumeId}.webp`] : []),
      `/img/${item.look.poseId}.png`,
      `/ip-assets/${profile.slug}/turnaround.png`,
    ] } : {}),
  }
  profile.assets = [...profile.assets.filter((asset) => asset.id !== id), asset]
  profile.status = 'active'
  fs.mkdirSync(path.join(root, 'data/ip-prompts'), { recursive: true })
  fs.writeFileSync(path.join(root, 'data/ip-prompts', `${filename === item.kind ? profile.slug + '-' : ''}${filename}.txt`), item.prompt + '\n')
}
fs.writeFileSync(profilePath, JSON.stringify(profiles, null, 2) + '\n')
console.log(JSON.stringify({ characters: profiles.length, assets: profiles.reduce((count, profile) => count + profile.assets.length, 0) }))
