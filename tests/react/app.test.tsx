import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import App from '@/app/page'

let repo: DatabaseRepositoryInterface

describe('App', () => {
  afterEach(async () => {
    await clearRepo(repo)
  })

  it('renders three main cards', async () => {
    repo = await createPopulatedRepo()

    render(
      <DatabaseProvider repo={repo}>
        <SettingsProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </SettingsProvider>
      </DatabaseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Данные API')).toBeInTheDocument()
      expect(screen.getByText('Избранные курсы')).toBeInTheDocument()
      expect(screen.getByText('Мои средства')).toBeInTheDocument()
    })
  })
})
