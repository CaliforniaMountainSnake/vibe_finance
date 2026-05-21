'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const DEFAULT_BUDGET = 50

export function ProjectSettingsCard() {
  const [budget, setBudget] = useState([DEFAULT_BUDGET])
  const [notifications, setNotifications] = useState(true)
  const [autoAssign, setAutoAssign] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Project Settings</CardTitle>
        <CardDescription>Configure preferences and allocations.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Budget allocation</label>
            <span className="text-sm tabular-nums text-muted-foreground">${budget[0]}K</span>
          </div>
          <Slider value={budget} onValueChange={setBudget} max={100} step={5} />
          <p className="text-xs text-muted-foreground">Drag the slider to set the monthly budget for the project.</p>
        </div>

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
              <span className="text-xs text-muted-foreground">Automatically assign new tasks to available members</span>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
