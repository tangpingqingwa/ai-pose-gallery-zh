import { createFileRoute } from '@tanstack/react-router'
import { SettingLibraryPage } from '@/components/library/SettingLibraryPage'
export const Route = createFileRoute('/voices')({ staticData: { title: '语言与声音库' }, component: () => <SettingLibraryPage group="voice" /> })
