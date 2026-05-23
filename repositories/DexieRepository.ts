import Dexie, { type Table } from 'dexie'
import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

/**
 * Схема БД
 */
class FinanceDb extends Dexie {
  exchangeRates!: Table<ExchangeRate, [string, string]>

  constructor() {
    super('VibeFinanceDb')

    this.version(1).stores({
      // '[source+ticker]' — составной первичный ключ
      // 'source'          — индекс для удаления/выборки по источнику
      // 'ticker'          — индекс для быстрого поиска по тикеру
      exchangeRates: '[source+ticker], source, ticker',
    })
  }
}

/**
 * Репозиторий
 */
export class DexieRepository implements DbRepositoryInterface {
  private readonly db: FinanceDb

  constructor() {
    this.db = new FinanceDb()
  }

  async updateDataForSource(source: SourceName, rates: ExchangeRate[]): Promise<void> {
    await this.db.transaction('rw', this.db.exchangeRates, async () => {
      await this.db.exchangeRates.where('source').equals(source).delete()
      await this.db.exchangeRates.bulkPut(rates)
    })
  }

  async getRate(fromTicker: string, toTicker: string): Promise<number> {
    const from = fromTicker.toLowerCase()
    const to = toTicker.toLowerCase()

    const [fromRecord, toRecord] = await Promise.all([
      this.db.exchangeRates.where('ticker').equals(from).first(),
      this.db.exchangeRates.where('ticker').equals(to).first(),
    ])

    if (!fromRecord) {
      throw new Error(`Unknown ticker: ${fromTicker}`)
    }
    if (!toRecord) {
      throw new Error(`Unknown ticker: ${toTicker}`)
    }
    if (fromRecord.btcPrice <= 0) {
      throw new Error(`Invalid btcPrice for ticker ${fromTicker}: ${fromRecord.btcPrice}`)
    }

    return toRecord.btcPrice / fromRecord.btcPrice
  }

  async getAllRates(): Promise<ExchangeRate[]> {
    return await this.db.exchangeRates.toArray()
  }

  async clearAll(): Promise<void> {
    await this.db.exchangeRates.clear()
  }
}
