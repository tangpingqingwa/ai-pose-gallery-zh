import type { SettingBindings } from './settings'

export type CharacterAssetKind = 'portrait' | 'turnaround' | 'expressions' | 'lifestyle' | 'detail' | 'gesture' | 'grooming'

export interface CharacterBelonging { id: string; name: string; description: string; history: string }
export interface CharacterWardrobe { id: string; name: string; occasion: string; description: string }
export interface CharacterRelationship { id: string; name: string; role: string; dynamic: string }
export interface CharacterEvent { id: string; date: string; title: string; summary: string; belongingIds: string[]; wardrobeId?: string; consequence: string }
export interface CharacterWorld {
  personality?: string
  background?: string
  occupation: string
  routine: string
  habits: string
  preferences: string
  imperfections: string
  speechStyle: string
  mannerisms: string
  boundaries: string
  belongings: CharacterBelonging[]
  wardrobe: CharacterWardrobe[]
  relationships: CharacterRelationship[]
  events: CharacterEvent[]
}
export interface CharacterCreativeBrief {
  belongingIds: string[]
  wardrobeId?: string
  eventId?: string
  action: string
  emotion: string
  camera: string
  lighting: string
  continuity: string
  grooming?: string
}
export interface CharacterComposition { lookId?: string; costumeId?: string; poseId?: string; scene?: string; customOutfit?: string; creativeBrief?: CharacterCreativeBrief; settingBindings?: SettingBindings }

export interface CharacterVoiceSample { id: string; title: string; url: string; mimeType: string; createdAt: string; transcript: string; generator: string; characterVersion?: number; intendedLocale?: string }
export interface CharacterVoice {
  language: string
  locale: string
  dialect: string
  secondaryLanguages: string
  accent: string
  accentStrength: string
  timbre: string
  pitch: string
  pace: string
  prosody: string
  speechHabits: string
  pronunciation: string
  avoid: string
  sampleText: string
  samples: CharacterVoiceSample[]
}

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
  composition?: CharacterComposition
  binding?: { belongingIds?: string[]; wardrobeId?: string; eventId?: string }
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
  settingBindings?: SettingBindings
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
  world?: CharacterWorld
  voice?: CharacterVoice
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
