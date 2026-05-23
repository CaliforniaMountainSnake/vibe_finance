import Dexie, { type Table } from 'dexie'
import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type FavoriteRate } from '@/entities/FavoriteRate'
import { type TickerPair } from '@/entities/TickerPair'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

const MS_PER_SECOND = 1000
const DB_VERSION_1 = 1
const DB_VERSION_2 = 2

/**
 * Схема БД
 */
class FinanceDb extends Dexie {
  exchangeRates!: Table<ExchangeRate, [string, string]>
  favoriteRates!: Table<FavoriteRate, [string, string]>

  constructor() {
    super('VibeFinanceDb')

    this.version(DB_VERSION_1).stores({
      // '[source+ticker]' — составной первичный ключ
      // 'source'          — индекс для удаления/выборки по источнику
      // 'ticker'          — индекс для быстрого поиска по тикеру
      exchangeRates: '[source+ticker], source, ticker',
    })

    this.version(DB_VERSION_2).stores({
      // '[from+to]' — составной первичный ключ
      // 'addedAt' — индекс для сортировки по дате добавления
      favoriteRates: '[from+to], addedAt',
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

  async getRate(pair: TickerPair): Promise<number> {
    const from = pair.from.toLowerCase()
    const to = pair.to.toLowerCase()

    const [fromRecord, toRecord] = await Promise.all([
      this.db.exchangeRates.where('ticker').equals(from).first(),
      this.db.exchangeRates.where('ticker').equals(to).first(),
    ])

    if (!fromRecord) {
      throw new Error(`Unknown ticker: ${pair.from}`)
    }
    if (!toRecord) {
      throw new Error(`Unknown ticker: ${pair.to}`)
    }
    if (fromRecord.btcPrice <= 0) {
      throw new Error(`Invalid btcPrice for ticker ${pair.from}: ${fromRecord.btcPrice}`)
    }

    return toRecord.btcPrice / fromRecord.btcPrice
  }

  async getAllRates(): Promise<ExchangeRate[]> {
    return await this.db.exchangeRates.toArray()
  }

  async clearAll(): Promise<void> {
    await this.db.exchangeRates.clear()
    await this.db.favoriteRates.clear()
  }

  async addFavoriteRate(pair: TickerPair): Promise<void> {
    const from = pair.from.toLowerCase()
    const to = pair.to.toLowerCase()
    const existing = await this.db.favoriteRates.get([from, to])
    if (!existing) {
      await this.db.favoriteRates.put({ from: from, to: to, addedAt: Date.now() / MS_PER_SECOND })
    }
  }

  async removeFavoriteRate(pair: TickerPair): Promise<void> {
    await this.db.favoriteRates.delete([pair.from.toLowerCase(), pair.to.toLowerCase()])
  }

  async getFavoriteRates(): Promise<TickerPair[]> {
    const records = await this.db.favoriteRates.orderBy('addedAt').reverse().toArray()
    return records.map((r) => ({ from: r.from, to: r.to }))
  }

  async isFavoriteRate(pair: TickerPair): Promise<boolean> {
    const record = await this.db.favoriteRates.get([pair.from.toLowerCase(), pair.to.toLowerCase()])
    return record !== undefined
  }
}
