import type { CostumeItem, PortraitItem } from '@/types/gallery'

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

export const ASIAN_DESIGN_REGIONS = ['东亚', '东南亚', '南亚', '中亚', '西亚'] as const

export function matchesPortraitRegion(region: string | undefined, selected: string): boolean {
  if (!selected) return true
  if (selected === '亚洲（全部）') return (ASIAN_DESIGN_REGIONS as readonly string[]).includes(region ?? '')
  return (region ?? '未标注') === selected
}

export function portraitRegionGroup(item: PortraitItem): string {
  return matchesPortraitRegion(item.catalog?.designRegion, '亚洲（全部）') ? '亚洲' : item.catalog?.market ?? '未标注'
}

/** Each round covers age/presentation cells, with a different region starting each cell. */
export function orderPortraitCatalog(items: PortraitItem[]): PortraitItem[] {
  const regions = [...new Set([...items].reverse().map((item) => item.catalog?.designRegion ?? item.catalog?.market ?? '未标注'))]
  const cells = new Map<string, Map<string, PortraitItem[]>>()
  for (const item of [...items].reverse()) {
    const cell = `${item.catalog?.presentation ?? '未标注'}:${item.catalog?.ageBand ?? '未标注'}`
    const region = item.catalog?.designRegion ?? item.catalog?.market ?? '未标注'
    const groups = cells.get(cell) ?? new Map<string, PortraitItem[]>()
    groups.set(region, [...(groups.get(region) ?? []), item])
    cells.set(cell, groups)
  }
  const ordered: PortraitItem[] = []
  let round = 0
  while (ordered.length < items.length) {
    let cellIndex = 0
    for (const groups of cells.values()) {
      for (let offset = 0; offset < regions.length; offset++) {
        const pool = groups.get(regions[(round + cellIndex + offset) % regions.length])
        if (pool?.length) { ordered.push(pool.shift()!); break }
      }
      cellIndex += 1
    }
    round += 1
  }
  return ordered
}

/** Region is chosen before age/presentation, so larger batches do not determine the mix. */
export function randomPortraitItem(items: PortraitItem[], random = Math.random): PortraitItem | undefined {
  const regions = [...new Set(items.map(portraitRegionGroup))]
  if (!regions.length) return undefined
  const region = regions[Math.min(regions.length - 1, Math.floor(random() * regions.length))]
  const regional = items.filter((item) => portraitRegionGroup(item) === region)
  return randomCatalogItem(regional, (item) => `${item.catalog?.presentation ?? '未标注'}:${item.catalog?.ageBand ?? '未标注'}`, random)
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
