import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { FavoriteRatesCard } from '@/app/_components/favorite-rates-card'
import { makeRenderer } from './helpers'

function getRateTexts(): string[] {
  const rateCells = document.querySelectorAll<HTMLSpanElement>('span.tabular-nums')
  const result: string[] = []
  for (const cell of rateCells) {
    result.push(cell.textContent || '')
  }
  return result
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
  it('отображает строки избранного вместо пустого состояния', async () => {
    const { render } = await makeRenderer()
    render(<FavoriteRatesCard />)

    await waitFor(() => {
      expect(screen.queryByText('Нет избранных курсов.')).not.toBeInTheDocument()
    })
  })

  it('показывает from-тикеры в таблице', async () => {
    const { render } = await makeRenderer()
    render(<FavoriteRatesCard />)

    await waitFor(() => {
      // CSS uppercase не меняет textContent — в DOM лежит 'btc', 'usdt', 'eth'.
      // 'btc' встречается дважды (BTC→USDT и BTC→GEL).
      // 'usdt' — только один раз как from-тикер (suffix в rate — «USDT» uppercase).
      expect(screen.getAllByText('btc')).toHaveLength(2)
      expect(screen.getByText('eth')).toBeInTheDocument()
      expect(screen.getByText('usdt')).toBeInTheDocument()
    })
  })

  it('показывает рассчитанные курсы для избранных пар', async () => {
    const { render } = await makeRenderer()
    render(<FavoriteRatesCard />)

    await waitFor(assertRatesAreComputed)
  })

  it('отображает иконки источников с правильными aria-labels', async () => {
    const { render } = await makeRenderer()
    render(<FavoriteRatesCard />)

    await waitFor(() => {
      // sourceDisplayName('binance') → 'Binance'
      // sourceDisplayName('coingecko') → 'CoinGecko'
      const binanceIcons = document.querySelectorAll('svg[aria-label="Binance"]')
      const coinGeckoIcons = document.querySelectorAll('svg[aria-label="CoinGecko"]')
      expect(binanceIcons.length).toBeGreaterThan(0)
      expect(coinGeckoIcons.length).toBeGreaterThan(0)
    })
  })

  it('показывает 4 строки (по одной на избранную пару)', async () => {
    const { render } = await makeRenderer()
    render(<FavoriteRatesCard />)

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
