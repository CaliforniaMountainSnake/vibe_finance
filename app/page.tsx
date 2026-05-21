'use client'

import { DashboardHeader } from './_components/dashboard-header'
import { StatsCards } from './_components/stats-cards'
import { SprintProgressCard } from './_components/sprint-progress-card'
import { TasksTable } from './_components/tasks-table'
import { ProjectSettingsCard } from './_components/project-settings-card'
import { QuickCreateCard } from './_components/quick-create-card'
import { DashboardFooter } from './_components/dashboard-footer'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full gap-6">
      <DashboardHeader />
      <StatsCards />
      <SprintProgressCard />
      <TasksTable />
      <ProjectSettingsCard />
      <QuickCreateCard />
      <DashboardFooter />
    </div>
  )
}
