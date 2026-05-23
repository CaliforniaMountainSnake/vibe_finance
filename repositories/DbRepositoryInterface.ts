import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type TickerPair } from '@/entities/TickerPair'

/**
 * Контракт репозитория для локального хранения курсов валют в IndexedDB.
 */
export interface DbRepositoryInterface {
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
   *   rate = btcPrice(to) / btcPrice(from)
   *
   * @returns Сколько единиц `to` можно получить за 1 единицу `from`.
   * @throws Error если любой из тикеров не найден в БД.
   */
  getRate(pair: TickerPair): Promise<number>

  /** Получить все курсы из БД. */
  getAllRates(): Promise<ExchangeRate[]>

  /** Очистить всю базу. */
  clearAll(): Promise<void>

  /**
   * Добавить пару тикеров в избранное.
   * Если пара уже в избранном — операция идемпотентна.
   */
  addFavoriteRate(pair: TickerPair): Promise<void>

  /**
   * Удалить пару тикеров из избранного.
   * Если пары нет в избранном — операция идемпотентна.
   */
  removeFavoriteRate(pair: TickerPair): Promise<void>

  /**
   * Получить все избранные пары, отсортированные по дате добавления (новые сверху).
   */
  getFavoriteRates(): Promise<TickerPair[]>

  /** Проверить, находится ли пара тикеров в избранном. */
  isFavoriteRate(pair: TickerPair): Promise<boolean>
}
