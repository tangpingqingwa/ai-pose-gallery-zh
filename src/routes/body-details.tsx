import { createFileRoute } from '@tanstack/react-router'
import { visualReferencesQuery } from '@/api/gallery'
import { ReferenceLibraryPage } from '@/components/library/ReferenceLibraryPage'
export const Route = createFileRoute('/body-details')({ staticData: { title: '体型细节库' }, loader: ({ context }) => context.queryClient.ensureQueryData(visualReferencesQuery), component: () => <ReferenceLibraryPage kind="body-details" /> })
