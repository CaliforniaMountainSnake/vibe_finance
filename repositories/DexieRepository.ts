import Dexie, { type Table } from 'dexie'
import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type FavoriteRate } from '@/entities/FavoriteRate'
import { type Ticker } from '@/entities/Ticker'
import { type TickerPair } from '@/entities/TickerPair'
import { type DbRepositoryInterface } from '@/repositories/DbRepositoryInterface'

const DB_VERSION_1 = 1
const DB_VERSION_2 = 2
const DB_VERSION_3 = 3
const DB_VERSION_4 = 4
const DB_VERSION_5 = 5

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

    // v5: заменяем addedAt на order — мигрируем существующие записи
    this.version(DB_VERSION_5)
      .stores({
        exchangeRates: '[source+ticker], source, ticker',
        favoriteRates: 'id, order',
      })
      .upgrade(async (tx) => {
        const records = await tx.table('favoriteRates').toArray()
        const sorted = records.sort((a, b) => {
          const aTime = (a as { addedAt?: number }).addedAt ?? 0
          const bTime = (b as { addedAt?: number }).addedAt ?? 0
          return aTime - bTime
        })
        await tx.table('favoriteRates').clear()
        const migrated = sorted.map((r, i) => ({ ...r, order: i }))
        await tx.table('favoriteRates').bulkPut(migrated)
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

  async updateRatesForSource(source: SourceName, rates: ExchangeRate[]): Promise<void> {
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
      const maxOrder = await this.db.favoriteRates.orderBy('order').last()
      const nextOrder = maxOrder !== undefined ? maxOrder.order + 1 : 0
      await this.db.favoriteRates.put({
        from: pair.from,
        to: pair.to,
        order: nextOrder,
        id,
      })
    }
  }

  async removeFavoriteRate(pair: TickerPair): Promise<void> {
    await this.db.favoriteRates.delete(pairId(pair.from, pair.to))
  }

  async getFavoriteRates(): Promise<TickerPair[]> {
    const records = await this.db.favoriteRates.orderBy('order').toArray()
    return records.map((r) => ({ from: r.from, to: r.to }))
  }

  async isFavoriteRate(pair: TickerPair): Promise<boolean> {
    const record = await this.db.favoriteRates.get(pairId(pair.from, pair.to))
    return record !== undefined
  }

  async getUpdateTime(source: SourceName): Promise<number | null> {
    const row = await this.db.exchangeRates.where('source').equals(source).first()
    return row ? row.updatedAt : null
  }

  async moveFavoriteRateUp(pair: TickerPair): Promise<void> {
    await this.swapWithNeighbor(pair, 'above')
  }

  async moveFavoriteRateDown(pair: TickerPair): Promise<void> {
    await this.swapWithNeighbor(pair, 'below')
  }

  private async swapWithNeighbor(pair: TickerPair, direction: 'above' | 'below'): Promise<void> {
    const id = pairId(pair.from, pair.to)
    const current = await this.db.favoriteRates.get(id)
    if (!current) return

    const collection =
      direction === 'above'
        ? this.db.favoriteRates.where('order').below(current.order).reverse()
        : this.db.favoriteRates.where('order').above(current.order)

    const neighbor = await collection.first()
    if (!neighbor) return

    const tmp = current.order
    current.order = neighbor.order
    neighbor.order = tmp
    await this.db.favoriteRates.bulkPut([current, neighbor])
  }
}
