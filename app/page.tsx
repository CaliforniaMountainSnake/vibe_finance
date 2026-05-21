'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { MoreHorizontal, Users, TrendingUp, CheckCircle2, Clock, Settings, LogOut, User } from 'lucide-react'

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

export default function Home() {
  const [budget, setBudget] = useState([50])
  const [notifications, setNotifications] = useState(true)
  const [autoAssign, setAutoAssign] = useState(false)

  return (
    <div className="flex flex-col flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your project &amp; tasks</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Stats cards ── */}
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

      {/* ── Sprint progress bar ── */}
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

      {/* ── Task table ── */}
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

      {/* ── Controls demo: Slider, Select, Switch ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Project Settings</CardTitle>
          <CardDescription>Configure preferences and allocations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Budget slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Budget allocation</label>
              <span className="text-sm tabular-nums text-muted-foreground">${budget[0]}K</span>
            </div>
            <Slider value={budget} onValueChange={setBudget} max={100} step={5} />
            <p className="text-xs text-muted-foreground">Drag the slider to set the monthly budget for the project.</p>
          </div>

          {/* Team size select */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Team size</label>
            <Select defaultValue="4">
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 members</SelectItem>
                <SelectItem value="4">4 members</SelectItem>
                <SelectItem value="6">6 members</SelectItem>
                <SelectItem value="8">8 members</SelectItem>
                <SelectItem value="10">10 members</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose how many people are on your team.</p>
          </div>

          {/* Switches */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Email notifications</span>
                <span className="text-xs text-muted-foreground">Receive task updates via email</span>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Auto-assign tasks</span>
                <span className="text-xs text-muted-foreground">
                  Automatically assign new tasks to available members
                </span>
              </div>
              <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick input card ── */}
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

      {/* ── Footer text ── */}
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
    </div>
  )
}
