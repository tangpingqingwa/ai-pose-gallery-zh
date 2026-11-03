import { useEffect, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function LibraryImageDialog({ item, onClose, onPrevious, onNext, children }: { item: { id: string; title: string; url: string; description?: string } | null; onClose: () => void; onPrevious?: () => void; onNext?: () => void; children?: ReactNode }) {
  useEffect(() => {
    if (!item) return
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
      if (event.key === 'ArrowLeft') onPrevious?.()
      if (event.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [item, onPrevious, onNext])
  return <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl">
      {item && <><DialogHeader><DialogTitle>{item.title}</DialogTitle><DialogDescription>{item.description || item.id}</DialogDescription></DialogHeader>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)]">
          <div className="relative flex min-h-64 items-center justify-center rounded-lg bg-muted/60 p-2">
            <img src={item.url} alt={item.title} className="max-h-[70dvh] w-full object-contain" />
            {onPrevious && <Button type="button" size="icon" variant="secondary" aria-label="上一张" className="absolute left-2 top-1/2 rounded-full" onClick={onPrevious}><ChevronLeftIcon className="size-4" /></Button>}
            {onNext && <Button type="button" size="icon" variant="secondary" aria-label="下一张" className="absolute right-2 top-1/2 rounded-full" onClick={onNext}><ChevronRightIcon className="size-4" /></Button>}
          </div>
          <div className="min-w-0 space-y-4">{children}<Button size="sm" variant="outline" asChild><a href={item.url} download={`${item.id}.png`}><DownloadIcon className="size-3.5" />下载原图</a></Button></div>
        </div>
      </>}
    </DialogContent>
  </Dialog>
}
