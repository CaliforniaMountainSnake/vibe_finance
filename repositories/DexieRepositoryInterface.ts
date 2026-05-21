import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'

/**
 * Контракт Dexie-репозитория для локального хранения курсов валют в IndexedDB.
 */
export interface DexieRepositoryInterface {
  /**
   * Атомарно обновить все курсы для указанного источника:
   *  1. Удалить все старые записи с этим source.
   *  2. Записать новые переданные курсы.
   *
   * Гарантирует, что при делистинге монеты её тикер не останется в БД.
   */
  updateDataForSource(source: SourceName, rates: ExchangeRate[]): Promise<void>

  /**
   * Вычислить курс между двумя тикерами за O(log n).
   *
   *   rate = btcPrice(toTicker) / btcPrice(fromTicker)
   *
   * @returns Сколько единиц `toTicker` можно получить за 1 единицу `fromTicker`.
   * @throws Error если любой из тикеров не найден в БД.
   */
  getRate(fromTicker: string, toTicker: string): Promise<number>

  /** Получить все курсы из БД. */
  getAllRates(): Promise<ExchangeRate[]>

  /** Очистить всю базу. */
  clearAll(): Promise<void>
}
