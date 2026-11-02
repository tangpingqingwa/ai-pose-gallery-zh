import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import seedData from '../../data/ip-characters.json'
import { idbGet, idbSet } from '@/lib/idbStorage'
import { validateCharacter } from '@/lib/characters'
import type { CharacterAsset, CharacterProfile } from '@/types/character'

const KEY = 'pose_atlas_character_library_v1'
const seedProfiles = seedData as CharacterProfile[]

interface LibraryContext {
  profiles: CharacterProfile[]
  hydrated: boolean
  storageError: boolean
  saveProfile: (profile: CharacterProfile) => void
  importProfiles: (value: unknown) => number
  addAsset: (id: string, asset: CharacterAsset) => void
  reviewAsset: (id: string, assetId: string) => void
}

const CharacterContext = createContext<LibraryContext | null>(null)

export function CharacterLibraryProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<CharacterProfile[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const writes = useRef(Promise.resolve())
  const profiles = useMemo(() => {
    const map = new Map(seedProfiles.map((profile) => [profile.id, profile]))
    for (const profile of overrides) map.set(profile.id, profile)
    return [...map.values()]
  }, [overrides])

  useEffect(() => {
    let active = true
    void idbGet<CharacterProfile[]>(KEY).then((saved) => {
      if (!active) return
      if (Array.isArray(saved)) {
        try {
          saved.forEach(validateCharacter)
          setOverrides(saved)
        } catch {
          setStorageError(true)
          toast.error('本机角色档案格式异常，未覆盖内置档案')
        }
      }
      setHydrated(true)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writes.current = writes.current.then(async () => {
      try {
        await idbSet(KEY, overrides, true)
        setStorageError(false)
      } catch {
        setStorageError(true)
        toast.error('角色修改暂未写入本机，请先导出档案备份')
      }
    })
  }, [overrides, hydrated])

  function requireReady() {
    if (!hydrated) throw new Error('角色档案仍在载入，请稍后再试')
  }

  function saveProfile(profile: CharacterProfile) {
    requireReady()
    validateCharacter(profile)
    const previous = profiles.find((item) => item.id === profile.id)
    const next = structuredClone({ ...profile, version: previous ? previous.version + 1 : 1, updatedAt: new Date().toISOString() })
    setOverrides((items) => [...items.filter((item) => item.id !== next.id), next])
  }

  function importProfiles(value: unknown) {
    requireReady()
    const entries = Array.isArray(value) ? value : [value]
    if (!entries.length || entries.length > 200) throw new Error('一次可导入 1–200 个角色档案')
    entries.forEach(validateCharacter)
    if (new Set(entries.map((profile) => profile.id)).size !== entries.length) throw new Error('导入文件包含重复角色 ID')
    // Validate the whole batch before changing any local records.
    setOverrides((items) => {
      const map = new Map(items.map((item) => [item.id, item]))
      for (const profile of entries) map.set(profile.id, structuredClone(profile))
      return [...map.values()]
    })
    return entries.length
  }

  function addAsset(id: string, asset: CharacterAsset) {
    requireReady()
    const profile = profiles.find((item) => item.id === id)
    if (!profile) throw new Error('找不到成品所属角色，请先导入该角色档案')
    const next = { ...profile, assets: [...profile.assets.filter((item) => item.id !== asset.id), asset], updatedAt: new Date().toISOString() }
    validateCharacter(next)
    setOverrides((items) => [...items.filter((item) => item.id !== id), next])
  }

  function reviewAsset(id: string, assetId: string) {
    requireReady()
    const profile = profiles.find((item) => item.id === id)
    if (!profile) throw new Error('找不到该角色')
    const next: CharacterProfile = { ...profile, assets: profile.assets.map((asset) => asset.id === assetId ? { ...asset, review: 'reviewed' } : asset), updatedAt: new Date().toISOString() }
    setOverrides((items) => [...items.filter((item) => item.id !== id), next])
  }

  return <CharacterContext.Provider value={{ profiles, hydrated, storageError, saveProfile, importProfiles, addAsset, reviewAsset }}>{children}</CharacterContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useCharacterLibrary() {
  const value = useContext(CharacterContext)
  if (!value) throw new Error('CharacterLibraryProvider is missing')
  return value
}
