import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal } from 'lucide-react'

const tasks = [
  { id: 1, name: 'Design new landing page', assignee: 'Alice', status: 'In Progress', priority: 'High', progress: 65 },
  { id: 2, name: 'Implement authentication flow', assignee: 'Bob', status: 'Done', priority: 'High', progress: 100 },
  { id: 3, name: 'Write API documentation', assignee: 'Carol', status: 'Todo', priority: 'Medium', progress: 0 },
  { id: 4, name: 'Fix mobile layout bugs', assignee: 'Alice', status: 'In Progress', priority: 'Low', progress: 40 },
  { id: 5, name: 'Set up CI/CD pipeline', assignee: 'Dave', status: 'Review', priority: 'Medium', progress: 85 },
]

const statusVariant = (status: string) => {
  switch (status) {
    case 'Done':
      return 'default' as const
    case 'In Progress':
      return 'secondary' as const
    case 'Review':
      return 'outline' as const
    default:
      return 'outline' as const
  }
}

const priorityVariant = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'default' as const
    case 'Medium':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

export function TasksTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>A list of current project tasks.</CardDescription>
          </div>
          <Button size="sm">Add task</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableCaption>5 tasks across the project.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell className="text-muted-foreground">{task.assignee}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={task.progress} className="w-16" />
                    <span className="text-xs tabular-nums text-muted-foreground w-7">{task.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs" className="size-7">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
