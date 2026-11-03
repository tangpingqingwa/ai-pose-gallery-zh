import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import seed from '../../data/setting-records.json'
import { idbGet, idbSet } from '@/lib/idbStorage'
import { validateSettingRecord } from '@/lib/settingLibrary'
import type { SettingRecord } from '@/types/settings'

const KEY = 'pose_atlas_setting_library_v1'
const seedRecords = seed as unknown as SettingRecord[]
seedRecords.forEach(validateSettingRecord)
interface LocalRecords { overrides: SettingRecord[]; deletedIds: string[] }
interface SettingLibrary { records: SettingRecord[]; hydrated: boolean; storageError: boolean; saveRecord: (record: SettingRecord) => void; deleteRecord: (id: string) => void; importRecords: (value: unknown) => number }
const Context = createContext<SettingLibrary | null>(null)

export function SettingLibraryProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<LocalRecords>({ overrides: [], deletedIds: [] })
  const [hydrated, setHydrated] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const writes = useRef(Promise.resolve())
  const records = useMemo(() => {
    const map = new Map(seedRecords.map((record) => [record.id, record]))
    for (const record of local.overrides) map.set(record.id, record)
    return [...map.values()].filter((record) => !local.deletedIds.includes(record.id))
  }, [local])
  useEffect(() => {
    let active = true
    void idbGet<LocalRecords>(KEY).then((saved) => {
      if (!active) return
      try {
        if (saved) {
          if (!Array.isArray(saved.overrides) || !Array.isArray(saved.deletedIds) || saved.deletedIds.some((id) => typeof id !== 'string')) throw new Error('Invalid setting library')
          saved.overrides.forEach(validateSettingRecord)
          setLocal(saved)
        }
      } catch { setStorageError(true) }
      setHydrated(true)
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!hydrated) return
    writes.current = writes.current.then(async () => {
      try { await idbSet(KEY, local, true); setStorageError(false) } catch { setStorageError(true) }
    })
  }, [hydrated, local])
  function ready() { if (!hydrated) throw new Error('设定记录正在载入，请稍后再试') }
  function saveRecord(record: SettingRecord) {
    ready(); validateSettingRecord(record)
    setLocal((previous) => ({ overrides: [...previous.overrides.filter((item) => item.id !== record.id), structuredClone(record)], deletedIds: previous.deletedIds.filter((id) => id !== record.id) }))
  }
  function deleteRecord(id: string) {
    ready()
    setLocal((previous) => ({ overrides: previous.overrides.filter((item) => item.id !== id), deletedIds: [...new Set([...previous.deletedIds, id])] }))
  }
  function importRecords(value: unknown) {
    ready()
    if (!Array.isArray(value) || !value.length || value.length > 1000) throw new Error('一次可导入 1–1000 条设定记录')
    value.forEach(validateSettingRecord)
    if (new Set(value.map((record) => record.id)).size !== value.length) throw new Error('记录编号重复')
    setLocal((previous) => {
      const map = new Map(previous.overrides.map((record) => [record.id, record]))
      for (const record of value) map.set(record.id, structuredClone(record))
      return { overrides: [...map.values()], deletedIds: previous.deletedIds.filter((id) => !map.has(id)) }
    })
    return value.length
  }
  return <Context.Provider value={{ records, hydrated, storageError, saveRecord, deleteRecord, importRecords }}>{children}</Context.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useSettingLibrary() {
  const context = useContext(Context)
  if (!context) throw new Error('SettingLibraryProvider is missing')
  return context
}
