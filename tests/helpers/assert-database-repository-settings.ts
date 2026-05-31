/**
 * Батарея тестов контракта SettingsDbRepositoryInterface.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { type DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { ticker } from './database-repository-test-helpers'

export function assertDatabaseRepositorySettings(makeRepo: () => DatabaseRepositoryInterface) {
  let repo: DatabaseRepositoryInterface

  beforeEach(() => {
    repo = makeRepo()
    return repo.clearAll()
  })

  // ---------------------------------------------------------------------------
  // getSetting
  // ---------------------------------------------------------------------------

  describe('getSetting', () => {
    it('returns undefined for an unset setting', async () => {
      const value = await repo.getSetting('totalBaseTicker')
      expect(value).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // setSetting / getSetting
  // ---------------------------------------------------------------------------

  describe('setSetting / getSetting', () => {
    it('persists a Ticker value', async () => {
      const btc = ticker('binance', 'btc')
      await repo.setSetting('totalBaseTicker', btc)

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toEqual(btc)
    })

    it('persists undefined value', async () => {
      await repo.setSetting('totalBaseTicker', ticker('binance', 'btc'))
      await repo.setSetting('totalBaseTicker', undefined)

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toBeUndefined()
    })

    it('overwrites a previously set value', async () => {
      await repo.setSetting('totalBaseTicker', ticker('binance', 'btc'))
      await repo.setSetting('totalBaseTicker', ticker('coingecko', 'usdt'))

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toEqual(ticker('coingecko', 'usdt'))
    })

    it('survives ClearAll for other tables (not calling clearAll in beforeEach)', async () => {
      await repo.setSetting('totalBaseTicker', ticker('binance', 'btc'))

      // after clearAll, the setting should be gone
      await repo.clearAll()

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // removeSetting
  // ---------------------------------------------------------------------------

  describe('removeSetting', () => {
    it('removes a previously set value', async () => {
      await repo.setSetting('totalBaseTicker', ticker('binance', 'btc'))
      await repo.removeSetting('totalBaseTicker')

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toBeUndefined()
    })

    it('is idempotent for non-existent key', async () => {
      await expect(repo.removeSetting('nonexistent-key')).resolves.toBeUndefined()

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toBeUndefined()
    })

    it('does not affect other settings', async () => {
      await repo.setSetting('totalBaseTicker', ticker('binance', 'btc'))
      // We can't test multiple keys yet (only one setting in AppSettingsMap),
      // but we verify the key still exists after removeSetting on a different key
      await repo.removeSetting('nonexistent-key')

      const stored = await repo.getSetting('totalBaseTicker')
      expect(stored).toEqual(ticker('binance', 'btc'))
    })
  })
}
