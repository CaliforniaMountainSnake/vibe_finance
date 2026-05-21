import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function QuickCreateCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Quick Create</CardTitle>
        <CardDescription>Add a new task to the backlog.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input placeholder="Task name..." />
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
        <Button size="sm">Create Task</Button>
      </CardFooter>
    </Card>
  )
}
