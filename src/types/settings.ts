export type SettingCategory = 'personality' | 'occupation' | 'background' | 'routine' | 'habits' | 'preferences' | 'imperfections' | 'speechStyle' | 'mannerisms' | 'boundaries' | 'language' | 'multilingual' | 'timbre' | 'pitch' | 'pace' | 'prosody' | 'speechHabits' | 'pronunciation' | 'avoid'
export type SettingGroup = 'life' | 'voice'
export interface SettingRecord {
  id: string
  category: SettingCategory
  title: string
  tags: string[]
  values: Record<string, string>
  localePrefixes?: string[]
}
export interface SettingBinding { record: SettingRecord; locked: boolean; origin: 'specified' | 'random' }
export type SettingBindings = Partial<Record<SettingCategory, SettingBinding>>
