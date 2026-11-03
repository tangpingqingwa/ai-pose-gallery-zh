import { createFileRoute } from '@tanstack/react-router'
import { visualReferencesQuery } from '@/api/gallery'
import { ReferenceLibraryPage } from '@/components/library/ReferenceLibraryPage'
export const Route = createFileRoute('/grooming')({ staticData: { title: '妆发状态库' }, loader: ({ context }) => context.queryClient.ensureQueryData(visualReferencesQuery), component: () => <ReferenceLibraryPage kind="grooming" /> })
