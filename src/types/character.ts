export type CharacterAssetKind = 'portrait' | 'turnaround' | 'expressions' | 'lifestyle'

export interface CharacterAsset {
  id: string
  kind: CharacterAssetKind
  title: string
  url: string
  parentAssetIds: string[]
  createdAt: string
  generator: string
  prompt: string
  review: 'unreviewed' | 'reviewed'
  width?: number
  height?: number
  sha256?: string
  sourceGenerationId?: string
  characterVersion?: number
  sourceReferenceUrls?: string[]
  composition?: { lookId?: string; costumeId?: string; poseId?: string; scene?: string; customOutfit?: string }
}

export interface CharacterLook {
  id: string
  characterId: string
  title: string
  costumeId?: string
  poseId: string
  scene: string
  customOutfit?: string
}

export interface CharacterBody {
  basis: 'design_target'
  heightCm: number
  weightKg: number
  chestCm: number
  waistCm: number
  hipsCm: number
  shoulderCm: number
  inseamCm: number
}

export interface CharacterIdentity {
  id: string
  version: number
  name: string
  displayName: string
  age: number
  gender: string
  appearance: {
    skin: string
    hair: string
    eyes: string
    face: string
    nose: string
    lips: string
    brows: string
    marks: string[]
    bodyType: string
    promptEn: string
    bodyEn: string
  }
  body: CharacterBody
  style: { signatureOutfit: string; palette: string[]; outfitEn: string }
}

export interface CharacterProfile extends CharacterIdentity {
  schemaVersion: 1
  slug: string
  market: string[]
  baseCity: string
  tagline: string
  status: 'draft' | 'active'
  persona: { positioning: string; topics: string[]; personality: string[]; bio: string; voice: string }
  assets: CharacterAsset[]
  rights: { origin: string; generator: string; licenseNote: string; source: string; createdAt: string }
  updatedAt: string
}
