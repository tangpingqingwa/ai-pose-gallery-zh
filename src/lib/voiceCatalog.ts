import type { SettingRecord } from '@/types/settings'

const regionalGroups: Record<string, string[]> = {
  '欧洲': ['GB', 'IE', 'FR', 'BE', 'CH', 'DE', 'AT', 'PT', 'ES', 'IT', 'NL', 'PL', 'SE'],
  '北美（美加）': ['US', 'CA'],
  '拉丁美洲': ['MX', 'AR', 'CO', 'CL', 'PE', 'UY', 'CU', 'PR', 'VE', 'BR', 'DO'],
  '亚太': ['CN', 'HK', 'TW', 'AU', 'NZ', 'JP', 'KR', 'SG', 'IN', 'BD', 'PK', 'ID', 'MY', 'TH', 'VN'],
  '西亚与中亚': ['TR', 'SA'],
  '非洲': ['EG', 'KE', 'ZA'],
}
const countryNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' })

export function voiceRecordFacets(record: SettingRecord) {
  if (record.category !== 'language') return null
  try {
    const locale = new Intl.Locale(record.values.locale)
    const country = locale.region ?? ''
    return {
      language: record.values.language,
      region: Object.entries(regionalGroups).find(([, countries]) => countries.includes(country))?.[0] ?? '其他地区',
      locale: record.values.locale,
      country: country ? `${countryNames.of(country)} · ${record.values.locale}` : record.values.locale,
    }
  } catch {
    return { language: record.values.language, region: '其他地区', locale: record.values.locale, country: record.values.locale }
  }
}

export function matchesVoiceFacets(record: SettingRecord, filters: { language: string; region: string; country: string }) {
  if (!filters.language && !filters.region && !filters.country) return true
  const facets = voiceRecordFacets(record)
  return Boolean(facets && (!filters.language || facets.language === filters.language) && (!filters.region || facets.region === filters.region) && (!filters.country || facets.country === filters.country))
}
