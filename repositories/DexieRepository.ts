import Dexie, { type Table } from 'dexie'
import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type FavoriteRate } from '@/entities/FavoriteRate'
import { type Ticker } from '@/entities/Ticker'
import { type TickerPair } from '@/entities/TickerPair'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

const MS_PER_SECOND = 1000
const DB_VERSION_1 = 1
const DB_VERSION_2 = 2
const DB_VERSION_3 = 3
const DB_VERSION_4 = 4

/**
 * Схема БД
 */
class FinanceDb extends Dexie {
  exchangeRates!: Table<ExchangeRate, [string, string]>
  favoriteRates!: Table<FavoriteRate, string>

  constructor() {
    super('VibeFinanceDb')

    this.version(DB_VERSION_1).stores({
      exchangeRates: '[source+ticker], source, ticker',
    })

    this.version(DB_VERSION_2).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: '[from+to], addedAt',
    })

    // v3: удаляем старую таблицу favoriteRates (Dexie не даёт менять первичный ключ на лету)
    this.version(DB_VERSION_3).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: null,
    })

    // v4: пересоздаём favoriteRates с новой схемой
    this.version(DB_VERSION_4).stores({
      exchangeRates: '[source+ticker], source, ticker',
      favoriteRates: 'id, addedAt',
    })
  }
}

/** Формирует уникальный идентификатор пары тикеров. */
function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
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
    const { from, to } = pair

    const [fromRecord, toRecord] = await Promise.all([
      this.db.exchangeRates.get([from.source, from.ticker]),
      this.db.exchangeRates.get([to.source, to.ticker]),
    ])

    if (!fromRecord) {
      throw new Error(`Unknown ticker: ${from.source}:${from.ticker}`)
    }
    if (!toRecord) {
      throw new Error(`Unknown ticker: ${to.source}:${to.ticker}`)
    }
    if (fromRecord.btcPrice <= 0) {
      throw new Error(`Invalid btcPrice for ticker ${from.source}:${from.ticker}: ${fromRecord.btcPrice}`)
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
    const id = pairId(pair.from, pair.to)
    const existing = await this.db.favoriteRates.get(id)
    if (!existing) {
      await this.db.favoriteRates.put({
        from: pair.from,
        to: pair.to,
        addedAt: Date.now() / MS_PER_SECOND,
        id,
      })
    }
  }

  async removeFavoriteRate(pair: TickerPair): Promise<void> {
    await this.db.favoriteRates.delete(pairId(pair.from, pair.to))
  }

  async getFavoriteRates(): Promise<TickerPair[]> {
    const records = await this.db.favoriteRates.orderBy('addedAt').reverse().toArray()
    return records.map((r) => ({ from: r.from, to: r.to }))
  }

  async isFavoriteRate(pair: TickerPair): Promise<boolean> {
    const record = await this.db.favoriteRates.get(pairId(pair.from, pair.to))
    return record !== undefined
  }
}
