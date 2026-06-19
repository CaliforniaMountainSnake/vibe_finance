import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExchangeRateRefreshCard } from '@/app/_components/exchange-rate-refresh-card'
import { makeRenderer } from './helpers'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import { createMockFinanceRepos, createErrorMockRepo } from './helpers/create-mock-finance-repos'
import { makeSnapshotKey } from '@/lib/snapshot-date'

describe('ExchangeRateRefreshCard — карточка обновления курсов', () => {
  it('в развёрнутой карточке отображает заголовок «Данные API» и кнопку обновления', async () => {
    const { render } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    expect(screen.getByText('Данные API')).toBeInTheDocument()
    expect(screen.getByLabelText('Обновить курсы')).toBeInTheDocument()
  })

  it('в развёрнутой карточке отображает строки для всех источников со статусом «ещё не обновлялось»', async () => {
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

  it('в развёрнутой карточке нажатие кнопки обновления обновляет курсы и показывает даты', async () => {
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

  it('сохраняет исторические снимки после обновления', async () => {
    const { render, databaseRepo } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    const today = makeSnapshotKey(new Date())

    await waitFor(async () => {
      // CoinGecko — содержит btc с btcPrice = 1
      const coingeckoSnapshots = await databaseRepo.getSnapshots({
        source: 'coingecko',
        ticker: 'btc',
        fromDate: today,
        toDate: today,
      })
      expect(coingeckoSnapshots.length).toBeGreaterThan(0)
      expect(coingeckoSnapshots[0].date).toBe(today)
      expect(coingeckoSnapshots[0].btcPrice).toBe(1)

      // Binance
      const binanceSnapshots = await databaseRepo.getSnapshots({
        source: 'binance',
        ticker: 'btc',
        fromDate: today,
        toDate: today,
      })
      expect(binanceSnapshots.length).toBeGreaterThan(0)

      // Bybit
      const bybitSnapshots = await databaseRepo.getSnapshots({
        source: 'bybit',
        ticker: 'btc',
        fromDate: today,
        toDate: today,
      })
      expect(bybitSnapshots.length).toBeGreaterThan(0)
    })
  })

  it('в развёрнутой карточке вызывает onRefreshed после завершения обновления', async () => {
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

  it('в развёрнутой карточке сохраняет курсы в БД после обновления', async () => {
    const { render, databaseRepo } = await makeRenderer(false)
    render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Обновить курсы'))

    await waitFor(async () => {
      const allRates = await databaseRepo.getAllRates()
      expect(allRates.length).toBeGreaterThan(0)
    })

    const allRates = await databaseRepo.getAllRates()
    const sources = new Set(allRates.map((r) => r.source))
    expect(sources).toContain('coingecko')
    expect(sources).toContain('binance')
    expect(sources).toContain('bybit')
    expect(sources).toContain('moex')
  })

  describe('отображение ошибок в развёрнутой карточке', () => {
    it('в развёрнутой карточке показывает ошибку при сбое одного источника', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) =>
        r.sourceName === 'binance' ? createErrorMockRepo('binance', 'API timeout') : r
      )
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText('ошибка')).toBeInTheDocument()
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
      })
    })

    it('в развёрнутой карточке показывает ошибки всех сбойных источников', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) => {
        if (r.sourceName === 'binance') return createErrorMockRepo('binance', 'API timeout')
        if (r.sourceName === 'bybit') return createErrorMockRepo('bybit', 'rate limit')
        return r
      })
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getAllByText('ошибка')).toHaveLength(2)
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
        expect(screen.getByText(/rate limit/)).toBeInTheDocument()
      })
    })

    it('в развёрнутой карточке показывает ошибки и успешные обновления (mixed state)', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) => {
        if (r.sourceName === 'binance') return createErrorMockRepo('binance', 'API timeout')
        if (r.sourceName === 'bybit') return createErrorMockRepo('bybit', 'rate limit')
        return r
      })
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard={false} />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getAllByText('ошибка')).toHaveLength(2)
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
        expect(screen.getByText(/rate limit/)).toBeInTheDocument()
        expect(screen.queryByText('—')).toBeNull()
      })
    })
  })

  describe('компактный режим', () => {
    it('в компактной карточке по умолчанию свёрнут и показывает «ещё не обновлялось»', async () => {
      const { render } = await makeRenderer(false)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      expect(screen.getByText('Данные API')).toBeInTheDocument()
      expect(screen.getByText('ещё не обновлялось')).toBeInTheDocument()
      expect(screen.queryByText('CoinGecko')).toBeNull()
      expect(screen.getByLabelText('Развернуть')).toBeInTheDocument()
    })

    it('в компактной карточке по тапу «Развернуть» показывает таблицу с источниками', async () => {
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

    it('в компактной карточке после обновления показывает относительное время самого старого источника', async () => {
      const { render } = await makeRenderer(false)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
      })
    })

    it('в компактной карточке показывает ошибку при сбое одного источника', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) =>
        r.sourceName === 'binance' ? createErrorMockRepo('binance', 'API timeout') : r
      )
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
      })
    })

    it('в компактной карточке показывает ошибки всех сбойных источников', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) => {
        if (r.sourceName === 'binance') return createErrorMockRepo('binance', 'API timeout')
        if (r.sourceName === 'bybit') return createErrorMockRepo('bybit', 'rate limit')
        return r
      })
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
        expect(screen.getByText(/rate limit/)).toBeInTheDocument()
      })
    })

    it('в компактной карточке показывает ошибки вместе с временем успешных обновлений (mixed state)', async () => {
      const defaultRepos = createMockFinanceRepos()
      const financeRepos: FinanceApiRepositoryInterface[] = defaultRepos.map((r) => {
        if (r.sourceName === 'binance') return createErrorMockRepo('binance', 'API timeout')
        if (r.sourceName === 'bybit') return createErrorMockRepo('bybit', 'rate limit')
        return r
      })
      const { render } = await makeRenderer(false, financeRepos)
      render(<ExchangeRateRefreshCard compactRefreshCard />)

      const user = userEvent.setup()
      await user.click(screen.getByLabelText('Обновить курсы'))

      await waitFor(() => {
        expect(screen.getByText(/Обновлено:/)).toBeInTheDocument()
        expect(screen.getByText(/API timeout/)).toBeInTheDocument()
        expect(screen.getByText(/rate limit/)).toBeInTheDocument()
      })
    })
  })
})
