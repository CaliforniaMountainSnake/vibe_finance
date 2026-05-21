import { Badge } from '@/components/ui/badge'

export function DashboardFooter() {
  return (
    <p className="text-center text-xs text-muted-foreground pb-4">
      Built with{' '}
      <Badge variant="secondary" className="text-[10px] px-1 py-0">
        Next.js
      </Badge>{' '}
      +{' '}
      <Badge variant="outline" className="text-[10px] px-1 py-0">
        shadcn/ui
      </Badge>{' '}
      +{' '}
      <Badge variant="secondary" className="text-[10px] px-1 py-0">
        Tailwind
      </Badge>
    </p>
  )
}
