import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExchangeRateRefreshCard } from '@/app/_components/exchange-rate-refresh-card'
import { makeRenderer } from './helpers'

describe('ExchangeRateRefreshCard — карточка обновления курсов', () => {
  it('отображает заголовок «Данные API» и кнопку обновления', async () => {
    const { render } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    expect(screen.getByText('Данные API')).toBeInTheDocument()
    expect(screen.getByLabelText('Обновить курсы')).toBeInTheDocument()
  })

  it('отображает строки для всех источников со статусом «ещё не обновлялось»', async () => {
    const { render } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    expect(screen.getByText('CoinGecko')).toBeInTheDocument()
    expect(screen.getByText('Binance')).toBeInTheDocument()
    expect(screen.getByText('Bybit')).toBeInTheDocument()
    expect(screen.getByText('MOEX')).toBeInTheDocument()

    // На пустой БД у всех источников статус «ещё не обновлялось»
    const fresh = screen.getAllByText('ещё не обновлялось')
    expect(fresh).toHaveLength(4)
  })

  it('нажатие кнопки обновления обновляет курсы и показывает даты', async () => {
    const { render } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    // До обновления — статус «ещё не обновлялось» и прочерки в дате
    expect(screen.getAllByText('ещё не обновлялось')).toHaveLength(4)
    expect(screen.getAllByText('—')).toHaveLength(4)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(() => {
      // Статус «ещё не обновлялось» исчез
      expect(screen.queryByText('ещё не обновлялось')).toBeNull()
      // Прочерки в дате исчезли — появились реальные даты
      expect(screen.queryByText('—')).toBeNull()
      // Ни у одного источника нет ошибки
      expect(screen.queryByText('ошибка')).toBeNull()
    })
  })

  it('вызывает onRefreshed после завершения обновления', async () => {
    const { render } = await makeRenderer(false)
    let called = false
    render(
      <ExchangeRateRefreshCard
        compactRefreshCard={false}
        onRefreshed={() => {
          called = true
        }}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(() => {
      expect(called).toBe(true)
    })
  })

  it('сохраняет курсы в БД после обновления', async () => {
    const { render, repo } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(async () => {
      const allRates = await repo.getAllRates()
      expect(allRates.length).toBeGreaterThan(0)
    })

    const allRates = await repo.getAllRates()
    const sources = new Set(allRates.map((r) => r.source))
    expect(sources).toContain('coingecko')
    expect(sources).toContain('binance')
    expect(sources).toContain('bybit')
    expect(sources).toContain('moex')
  })

  describe('компактный режим', () => {
    it('по умолчанию свёрнут и показывает «ещё не обновлялось»', async () => {
      const { render } = await makeRenderer(false)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      expect(screen.getByText('Данные API')).toBeInTheDocument()
      expect(screen.getByText('ещё не обновлялось')).toBeInTheDocument()
      expect(screen.queryByText('CoinGecko')).toBeNull()
      expect(screen.getByLabelText('Развернуть')).toBeInTheDocument()
    })

    it('по тапу «Развернуть» показывает таблицу с источниками', async () => {
      const { render } = await makeRenderer(false)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Развернуть'))

      expect(screen.getByText('CoinGecko')).toBeInTheDocument()
      expect(screen.getByText('Binance')).toBeInTheDocument()
      expect(screen.getByText('Bybit')).toBeInTheDocument()
      expect(screen.getByText('MOEX')).toBeInTheDocument()
      expect(screen.getByLabelText('Свернуть')).toBeInTheDocument()
    })

    it('после обновления показывает относительное время самого старого источника', async () => {
      const { render } = await makeRenderer(false)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
      })
    })
  })
})
