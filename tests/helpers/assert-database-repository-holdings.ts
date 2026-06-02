/**
 * Батарея тестов контракта HoldingsDbRepositoryInterface.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { ticker } from './database-repository-test-helpers'

export function assertDatabaseRepositoryHoldings(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  // ---------------------------------------------------------------------------
  // getHoldings
  // ---------------------------------------------------------------------------

  describe('getHoldings — получение списка холдингов', () => {
    it('returns empty array when no holdings exist', async () => {
      const holdings = await repo.getHoldings()
      expect(holdings).toEqual([])
    })

    it('returns holdings ordered by order', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1.5, 'Холд BTC')
      await repo.addHolding(ticker('binance', 'eth'), 10, 'ETH резерв')
      await repo.addHolding(ticker('coingecko', 'usdt'), 5000, 'USDT стейбл')

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(3)
      expect(holdings[0].label).toBe('Холд BTC')
      expect(holdings[0].order).toBe(0)
      expect(holdings[1].label).toBe('ETH резерв')
      expect(holdings[1].order).toBe(1)
      expect(holdings[2].label).toBe('USDT стейбл')
      expect(holdings[2].order).toBe(2)
    })

    it('returns complete Holding objects', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1.5, 'Тестовый холд')

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(1)
      const h = holdings[0]
      expect(typeof h.id).toBe('string')
      expect(h.id.length).toBeGreaterThan(0)
      expect(h.ticker).toEqual(ticker('binance', 'btc'))
      expect(h.amount).toBe(1.5)
      expect(h.label).toBe('Тестовый холд')
      expect(h.enabled).toBe(true)
      expect(typeof h.order).toBe('number')
    })
  })

  // ---------------------------------------------------------------------------
  // addHolding
  // ---------------------------------------------------------------------------

  describe('addHolding — добавление холдинга', () => {
    it('adds a holding with all fields', async () => {
      await repo.addHolding(ticker('coingecko', 'btc'), 2.5, 'Кошелек №1')

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(1)
      expect(holdings[0].ticker).toEqual(ticker('coingecko', 'btc'))
      expect(holdings[0].amount).toBe(2.5)
      expect(holdings[0].label).toBe('Кошелек №1')
      expect(holdings[0].enabled).toBe(true)
    })

    it('generates unique id for each holding', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'A')
      await repo.addHolding(ticker('binance', 'btc'), 1, 'B')

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(2)
      expect(holdings[0].id).not.toBe(holdings[1].id)
    })

    it('allows multiple holdings with same ticker', async () => {
      await repo.addHolding(ticker('binance', 'usdt'), 100, 'Карточка синего банка')
      await repo.addHolding(ticker('binance', 'usdt'), 200, 'Карточка зеленого банка')

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(2)
      expect(holdings[0].ticker).toEqual(ticker('binance', 'usdt'))
      expect(holdings[1].ticker).toEqual(ticker('binance', 'usdt'))
      expect(holdings[0].amount).toBe(100)
      expect(holdings[1].amount).toBe(200)
    })

    it('assigns order in insertion sequence', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 1, 'Second')
      await repo.addHolding(ticker('binance', 'usdt'), 1, 'Third')

      const holdings = await repo.getHoldings()
      expect(holdings[0].order).toBe(0)
      expect(holdings[1].order).toBe(1)
      expect(holdings[2].order).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // updateHolding
  // ---------------------------------------------------------------------------

  describe('updateHolding — обновление холдинга', () => {
    it('updates amount without changing other fields', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Original')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.updateHolding(id, { amount: 3.14 })

      const updated = await repo.getHoldings()
      expect(updated).toHaveLength(1)
      expect(updated[0].amount).toBe(3.14)
      expect(updated[0].label).toBe('Original')
      expect(updated[0].enabled).toBe(true)
    })

    it('updates label without changing other fields', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Original')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.updateHolding(id, { label: 'Renamed' })

      const updated = await repo.getHoldings()
      expect(updated[0].amount).toBe(1)
      expect(updated[0].label).toBe('Renamed')
      expect(updated[0].enabled).toBe(true)
    })

    it('toggles enabled flag', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Toggle test')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.updateHolding(id, { enabled: false })

      const updated = await repo.getHoldings()
      expect(updated[0].enabled).toBe(false)

      await repo.updateHolding(id, { enabled: true })
      const restored = await repo.getHoldings()
      expect(restored[0].enabled).toBe(true)
    })

    it('updates ticker', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Ticker test')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.updateHolding(id, { ticker: ticker('coingecko', 'usdt') })

      const updated = await repo.getHoldings()
      expect(updated[0].ticker).toEqual(ticker('coingecko', 'usdt'))
      expect(updated[0].amount).toBe(1)
      expect(updated[0].label).toBe('Ticker test')
      expect(updated[0].enabled).toBe(true)
    })

    it('updates multiple fields at once', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Original')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.updateHolding(id, {
        ticker: ticker('coingecko', 'eth'),
        amount: 5,
        label: 'Both changed',
        enabled: false,
      })

      const updated = await repo.getHoldings()
      expect(updated[0].ticker).toEqual(ticker('coingecko', 'eth'))
      expect(updated[0].amount).toBe(5)
      expect(updated[0].label).toBe('Both changed')
      expect(updated[0].enabled).toBe(false)
    })

    it('is idempotent for non-existent id', async () => {
      await expect(repo.updateHolding('nonexistent-id', { amount: 5 })).resolves.toBeUndefined()
    })

    it('does not affect other holdings', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')
      const all = await repo.getHoldings()
      const firstId = all[0].id

      await repo.updateHolding(firstId, { label: 'Changed' })

      const updated = await repo.getHoldings()
      expect(updated[0].label).toBe('Changed')
      expect(updated[1].label).toBe('Second')
    })
  })

  // ---------------------------------------------------------------------------
  // removeHolding
  // ---------------------------------------------------------------------------

  describe('removeHolding — удаление холдинга', () => {
    it('removes a holding by id', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')
      const holdings = await repo.getHoldings()
      const firstId = holdings[0].id

      await repo.removeHolding(firstId)

      const remaining = await repo.getHoldings()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].label).toBe('Second')
    })

    it('is idempotent for non-existent id', async () => {
      await expect(repo.removeHolding('nonexistent-id')).resolves.toBeUndefined()

      const holdings = await repo.getHoldings()
      expect(holdings).toEqual([])
    })

    it('removes the last holding leaving empty list', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'Solo')
      const holdings = await repo.getHoldings()
      const id = holdings[0].id

      await repo.removeHolding(id)

      const remaining = await repo.getHoldings()
      expect(remaining).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // moveHoldingUp / moveHoldingDown
  // ---------------------------------------------------------------------------

  describe('moveHoldingUp / moveHoldingDown — перемещение холдингов', () => {
    it('moveHoldingUp swaps with upper neighbor', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')
      await repo.addHolding(ticker('binance', 'usdt'), 3, 'Third')

      const holdings = await repo.getHoldings()
      const secondId = holdings[1].id

      await repo.moveHoldingUp(secondId)

      const reordered = await repo.getHoldings()
      expect(reordered[0].label).toBe('Second')
      expect(reordered[1].label).toBe('First')
      expect(reordered[2].label).toBe('Third')
    })

    it('moveHoldingUp on first is idempotent', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')

      const holdings = await repo.getHoldings()
      const firstId = holdings[0].id

      await repo.moveHoldingUp(firstId)

      const reordered = await repo.getHoldings()
      expect(reordered[0].label).toBe('First')
      expect(reordered[1].label).toBe('Second')
    })

    it('moveHoldingDown swaps with lower neighbor', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')
      await repo.addHolding(ticker('binance', 'usdt'), 3, 'Third')

      const holdings = await repo.getHoldings()
      const secondId = holdings[1].id

      await repo.moveHoldingDown(secondId)

      const reordered = await repo.getHoldings()
      expect(reordered[0].label).toBe('First')
      expect(reordered[1].label).toBe('Third')
      expect(reordered[2].label).toBe('Second')
    })

    it('moveHoldingDown on last is idempotent', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')

      const holdings = await repo.getHoldings()
      const lastId = holdings[1].id

      await repo.moveHoldingDown(lastId)

      const reordered = await repo.getHoldings()
      expect(reordered[0].label).toBe('First')
      expect(reordered[1].label).toBe('Second')
    })

    it('move up then down returns original order', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')
      await repo.addHolding(ticker('binance', 'eth'), 2, 'Second')

      const holdings = await repo.getHoldings()
      const secondId = holdings[1].id

      await repo.moveHoldingUp(secondId)
      await repo.moveHoldingDown(secondId)

      const reordered = await repo.getHoldings()
      expect(reordered[0].label).toBe('First')
      expect(reordered[1].label).toBe('Second')
    })

    it('does not throw on non-existent id', async () => {
      await repo.addHolding(ticker('binance', 'btc'), 1, 'First')

      await expect(repo.moveHoldingUp('nonexistent-id')).resolves.toBeUndefined()
      await expect(repo.moveHoldingDown('nonexistent-id')).resolves.toBeUndefined()

      const holdings = await repo.getHoldings()
      expect(holdings).toHaveLength(1)
    })
  })
}
