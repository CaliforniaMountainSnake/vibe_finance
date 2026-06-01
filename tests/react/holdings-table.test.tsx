import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HoldingsCard } from '@/app/_components/holdings-card'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'
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
          <LocaleProvider locale={TEST_LOCALE}>
            <TooltipProvider>
              <HoldingsCard />
            </TooltipProvider>
          </LocaleProvider>
        </SettingsProvider>
      </DatabaseProvider>
    )
  }

  it('отображает строки холдингов вместо пустого состояния', async () => {
    await renderCard()

    await waitFor(() => {
      expect(screen.queryByText('Нет сохранённых средств.')).not.toBeInTheDocument()
    })
  })

  it('показывает названия холдингов в таблице', async () => {
    await renderCard()

    await waitFor(() => {
      expect(screen.getByText('Холодный кошелёк')).toBeInTheDocument()
      expect(screen.getByText('Стейкинг')).toBeInTheDocument()
      expect(screen.getByText('Банковский счёт')).toBeInTheDocument()
      expect(screen.getByText('Наличные')).toBeInTheDocument()
    })
  })

  it('показывает тикер базовой валюты в таблице', async () => {
    await renderCard()

    await waitFor(() => {
      // totalBaseTicker = USDT — иконка итоговой валюты и отформатированный total в футере
      expect(screen.getByText('USDT')).toBeInTheDocument()
    })
  })

  it('показывает 4 записи холдингов (8 строк таблицы)', async () => {
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
