import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FavoriteRatesCard } from '@/app/_components/favorite-rates-card'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

let repo: DatabaseRepositoryInterface

function getRateTexts(): string[] {
  const rateCells = document.querySelectorAll('span.tabular-nums')
  return [...rateCells].map((cell) => cell.textContent ?? '')
}

function rateTextStartsWithDigit(text: string): boolean {
  return /^\d/.test(text.trim())
}

function rateTextIsDash(text: string): boolean {
  return text.trim() === '—'
}

function assertRatesAreComputed(): void {
  const rateTexts = getRateTexts()
  expect(rateTexts.length).toBeGreaterThan(0)

  const hasNumericRate = rateTexts.some((text) => rateTextStartsWithDigit(text))
  expect(hasNumericRate).toBe(true)

  const hasDash = rateTexts.some((text) => rateTextIsDash(text))
  expect(hasDash).toBe(false)
}

describe('FavoritesTable with populated mock data', () => {
  afterEach(async () => {
    await clearRepo(repo)
  })

  async function renderCard(): Promise<void> {
    repo = await createPopulatedRepo()
    render(
      <DatabaseProvider repo={repo}>
        <SettingsProvider>
          <TooltipProvider>
            <FavoriteRatesCard />
          </TooltipProvider>
        </SettingsProvider>
      </DatabaseProvider>
    )
  }

  it('renders favorite rows instead of empty state', async () => {
    await renderCard()

    await waitFor(() => {
      expect(screen.queryByText('Нет избранных курсов.')).not.toBeInTheDocument()
    })
  })

  it('shows from-tickers in the table (CSS uppercase, textContent is lowercase)', async () => {
    await renderCard()

    await waitFor(() => {
      // CSS uppercase не меняет textContent — в DOM лежит 'btc', 'usdt', 'eth'.
      // 'btc' встречается дважды (BTC→USDT и BTC→GEL).
      // 'usdt' — только один раз как from-тикер (suffix в rate — «USDT» uppercase).
      expect(screen.getAllByText('btc')).toHaveLength(2)
      expect(screen.getByText('eth')).toBeInTheDocument()
      expect(screen.getByText('usdt')).toBeInTheDocument()
    })
  })

  it('shows computed rates (non-dash) for favourite pairs', async () => {
    await renderCard()

    await waitFor(assertRatesAreComputed)
  })

  it('displays source icons with correct aria-labels', async () => {
    await renderCard()

    await waitFor(() => {
      // sourceDisplayName('binance') → 'Binance'
      // sourceDisplayName('coingecko') → 'CoinGecko'
      const binanceIcons = document.querySelectorAll('svg[aria-label="Binance"]')
      const coinGeckoIcons = document.querySelectorAll('svg[aria-label="CoinGecko"]')
      expect(binanceIcons.length).toBeGreaterThan(0)
      expect(coinGeckoIcons.length).toBeGreaterThan(0)
    })
  })

  it('shows 4 rows (one per favourite pair)', async () => {
    await renderCard()

    await waitFor(() => {
      const tbody = document.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      if (!tbody) {
        return
      }
      const rows = tbody.querySelectorAll('tr')
      expect(rows).toHaveLength(4)
    })
  })
})
