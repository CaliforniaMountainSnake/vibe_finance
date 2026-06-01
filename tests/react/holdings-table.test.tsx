import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HoldingsCard } from '@/app/_components/holdings-card'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

let repo: DatabaseRepositoryInterface

describe('HoldingsCard with populated mock data', () => {
  afterEach(async () => {
    await clearRepo(repo)
  })

  async function renderCard(): Promise<void> {
    repo = await createPopulatedRepo()
    render(
      <DatabaseProvider repo={repo}>
        <SettingsProvider>
          <TooltipProvider>
            <HoldingsCard />
          </TooltipProvider>
        </SettingsProvider>
      </DatabaseProvider>
    )
  }

  it('renders holding rows instead of empty state', async () => {
    await renderCard()

    await waitFor(() => {
      expect(screen.queryByText('Нет сохранённых средств.')).not.toBeInTheDocument()
    })
  })

  it('shows holding labels in the table', async () => {
    await renderCard()

    await waitFor(() => {
      expect(screen.getByText('Холодный кошелёк')).toBeInTheDocument()
      expect(screen.getByText('Стейкинг')).toBeInTheDocument()
      expect(screen.getByText('Банковский счёт')).toBeInTheDocument()
      expect(screen.getByText('Наличные')).toBeInTheDocument()
    })
  })

  it('shows base currency ticker in the table', async () => {
    await renderCard()

    await waitFor(() => {
      // totalBaseTicker = USDT — иконка итоговой валюты и отформатированный total в футере
      expect(screen.getByText('USDT')).toBeInTheDocument()
    })
  })

  it('shows 4 holding entries (8 table rows)', async () => {
    await renderCard()

    await waitFor(() => {
      const tbody = document.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      if (!tbody) return
      const rows = tbody.querySelectorAll('tr')
      expect(rows).toHaveLength(8)
    })
  })
})
