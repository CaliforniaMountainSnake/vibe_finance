import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { ExchangeRateProvider } from '@/app/providers/exchange-rate-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ExchangeRateRefreshCard } from '@/app/_components/exchange-rate-refresh-card'
import { createMockFinanceRepos } from './helpers/create-mock-finance-repos'
import { DexieRepository } from '@/repositories/dexie-repository'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

let repo: DatabaseRepositoryInterface

describe('ExchangeRateRefreshCard', () => {
  afterEach(async () => {
    await repo.clearAll()
  })

  function renderCard(onRefreshed?: () => void) {
    repo = new DexieRepository()

    return render(
      <DatabaseProvider repo={repo}>
        <ExchangeRateProvider repos={createMockFinanceRepos()}>
          <SettingsProvider>
            <LocaleProvider locale={TEST_LOCALE}>
              <TooltipProvider>
                <ExchangeRateRefreshCard onRefreshed={onRefreshed} />
              </TooltipProvider>
            </LocaleProvider>
          </SettingsProvider>
        </ExchangeRateProvider>
      </DatabaseProvider>
    )
  }

  it('отображает заголовок «Данные API» и кнопку обновления', () => {
    renderCard()

    expect(screen.getByText('Данные API')).toBeInTheDocument()
    expect(screen.getByLabelText('Обновить курсы')).toBeInTheDocument()
  })

  it('отображает строки для всех источников', () => {
    renderCard()

    expect(screen.getByText('CoinGecko')).toBeInTheDocument()
    expect(screen.getByText('Binance')).toBeInTheDocument()
    expect(screen.getByText('MOEX')).toBeInTheDocument()
  })

  it('нажатие кнопки обновления обновляет даты', async () => {
    renderCard()

    // До обновления — «ещё не обновлялось»
    const fresh = screen.getAllByText('ещё не обновлялось')
    expect(fresh.length).toBe(3)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    // После обновления — даты появятся, «ещё не обновлялось» исчезнет
    await waitFor(() => {
      expect(screen.queryByText('ещё не обновлялось')).toBeNull()
    })

    // Ни у одного источника нет ошибки
    expect(screen.queryByText('ошибка')).toBeNull()
  })

  it('вызывает onRefreshed после завершения обновления', async () => {
    let called = false
    renderCard(() => {
      called = true
    })

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(() => {
      expect(called).toBe(true)
    })
  })

  it('сохраняет курсы в БД после обновления', async () => {
    renderCard()

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(async () => {
      const allRates = await repo.getAllRates()
      expect(allRates.length).toBeGreaterThan(0)
    })

    // Проверяем, что данные есть для всех трёх источников
    const allRates = await repo.getAllRates()
    const sources = new Set(allRates.map((r) => r.source))
    expect(sources).toContain('coingecko')
    expect(sources).toContain('binance')
    expect(sources).toContain('moex')
  })
})
