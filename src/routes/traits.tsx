import { createFileRoute } from '@tanstack/react-router'
import { SettingLibraryPage } from '@/components/library/SettingLibraryPage'
export const Route = createFileRoute('/traits')({ staticData: { title: '个性与生活库' }, component: () => <SettingLibraryPage group="life" /> })
