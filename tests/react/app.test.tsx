import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockDatabaseRepo } from './mocks/database-repository-mock'
import App from '@/app/page'

describe('App', () => {
  it('renders three main cards', async () => {
    const mockRepo = createMockDatabaseRepo()

    render(
      <DatabaseProvider repo={mockRepo}>
        <SettingsProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </SettingsProvider>
      </DatabaseProvider>
    )

    expect(await screen.findByText('Данные API')).toBeInTheDocument()
    expect(await screen.findByText('Избранные курсы')).toBeInTheDocument()
    expect(await screen.findByText('Мои средства')).toBeInTheDocument()
  })
})
