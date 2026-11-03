import { createFileRoute } from '@tanstack/react-router'
import { visualReferencesQuery } from '@/api/gallery'
import { ReferenceLibraryPage } from '@/components/library/ReferenceLibraryPage'
export const Route = createFileRoute('/expressions')({ staticData: { title: '表情神态库' }, loader: ({ context }) => context.queryClient.ensureQueryData(visualReferencesQuery), component: () => <ReferenceLibraryPage kind="expressions" /> })
