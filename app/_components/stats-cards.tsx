import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Users, TrendingUp } from 'lucide-react'

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card size="sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">12</p>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">8</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">4</p>
            <p className="text-xs text-muted-foreground">Team members</p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">87%</p>
            <p className="text-xs text-muted-foreground">Sprint progress</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
