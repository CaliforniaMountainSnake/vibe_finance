import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function SprintProgressCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sprint Progress</CardTitle>
        <CardDescription>2 days remaining in the current sprint</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Progress value={87} className="flex-1" />
          <span className="text-sm font-medium tabular-nums text-muted-foreground">87%</span>
        </div>
      </CardContent>
    </Card>
  )
}
