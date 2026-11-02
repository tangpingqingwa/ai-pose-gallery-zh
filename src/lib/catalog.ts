import type { CostumeItem } from '@/types/gallery'

export function matchesCatalog(text: string, query: string): boolean {
  const haystack = text.normalize('NFKC').toLowerCase()
  return query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean).every((part) => haystack.includes(part))
}

export const costumeDescriptionKey = (item: CostumeItem) => item.关键词.trim().toLowerCase().replace(/\s+/g, ' ') || `id:${item.id}`

export function costumeDescriptionGroups(items: CostumeItem[]) {
  const groups = new Map<string, CostumeItem[]>()
  for (const item of items) {
    const key = costumeDescriptionKey(item)
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  return groups
}
