import whiteData from '../../data/white-model-references.json' with { type: 'json' }
import type { ExtraReferenceImage, RecipeState, VisualReferenceItem } from '@/types/gallery'
import { asLibraryReference, withLibraryReference } from './library.ts'

export const whiteModels = whiteData as VisualReferenceItem[]

export function migrateWhiteReferences(images: ExtraReferenceImage[] = []): ExtraReferenceImage[] {
  const migrated: ExtraReferenceImage[] = []
  for (const image of images) {
    if (image.source === 'library' && (['expressions', 'body-details', 'mannerisms'].includes(image.referenceKind ?? '') || ['expression', 'body_guide', 'identity_detail', 'gesture'].includes(image.role ?? ''))) continue
    if (image.source !== 'library' || image.renderMode === 'white_model') { migrated.push(image); continue }
    const kind = image.referenceKind
    const name = image.name
    const target = kind === 'grooming' ? /胡须/.test(name) ? 'WM-GRM-004' : /短发/.test(name) ? 'WM-GRM-001' : 'WM-GRM-002' : undefined
    const model = whiteModels.find((item) => item.id === target)
    if (!model) { migrated.push(image); continue }
    const instruction = image.instruction && !image.instruction.startsWith('目标：') ? image.instruction : undefined
    const reference = asLibraryReference(model, instruction)
    const previous = migrated.findIndex((item) => item.source === 'library' && item.referenceKind === reference.referenceKind && item.role === reference.role)
    if (previous >= 0) migrated.splice(previous, 1)
    migrated.push(reference)
  }
  return migrated
}

export function randomWhiteReferences(recipe: RecipeState, random = Math.random) {
  let images = (recipe.extraImages ?? []).filter((item) => item.source !== 'library')
  const presentation = recipe.character?.gender ?? recipe.portrait?.catalog?.presentation ?? ''
  const hair = recipe.character?.appearance.hair ?? recipe.portrait?.发长 ?? ''
  for (const kind of ['grooming'] as const) {
    const pool = whiteModels.filter((item) => item.kind === kind && (item.id !== 'WM-GRM-004' || presentation === '男性') && (item.id !== 'WM-GRM-002' || /长|中发/.test(hair)))
    const item = pool[Math.floor(random() * pool.length)]
    if (item) images = withLibraryReference(images, item)
  }
  return images
}
