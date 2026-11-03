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

/** Round-robin all groups, including groups introduced by later data expansions. */
export function interleaveCatalog<T>(items: T[], key: (item: T) => string): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const name = key(item)
    const group = groups.get(name) ?? []
    group.push(item)
    groups.set(name, group)
  }
  const ordered: T[] = []
  let index = 0
  while (ordered.length < items.length) {
    for (const group of groups.values()) if (index < group.length) ordered.push(group[index])
    index += 1
  }
  return ordered
}

export function matchesPortraitAge(age: number | undefined, band: string, selected: string): boolean {
  if (!selected) return true
  if (selected === '45岁及以上') return age !== undefined && age >= 45
  return band === selected
}

/** Pick a category before an image so a large legacy category cannot dominate. */
export function randomCatalogItem<T>(items: T[], key: (item: T) => string, random = Math.random): T | undefined {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const name = key(item)
    const group = groups.get(name) ?? []
    group.push(item)
    groups.set(name, group)
  }
  const buckets = [...groups.values()]
  if (!buckets.length) return undefined
  const bucket = buckets[Math.min(buckets.length - 1, Math.floor(random() * buckets.length))]
  return bucket[Math.min(bucket.length - 1, Math.floor(random() * bucket.length))]
}
