import { type ExchangeRate, type SourceName } from '@/entities/ExchangeRate'
import { type TickerPair } from '@/entities/TickerPair'

/**
 * Контракт репозитория для локального хранения курсов валют в IndexedDB.
 */
export interface DbRepositoryInterface extends ExchangeRatesDbRepositoryInterface, FavoriteRatesDbRepositoryInterface {
  /**
   * Очистить всю базу
   */
  clearAll(): Promise<void>
}

interface ExchangeRatesDbRepositoryInterface {
  /**
   * Атомарно обновить все курсы для указанного источника:
   *  1. Удалить все старые записи с этим source.
   *  2. Записать новые переданные курсы.
   *
   * Гарантирует, что при делистинге монеты её тикер не останется в БД.
   */
  updateRatesForSource(source: SourceName, rates: ExchangeRate[]): Promise<void>

  /**
   * Вычислить курс между двумя тикерами за O(log n).
   *
   *   rate = btcPrice(to) / btcPrice(from)
   *
   * @returns Сколько единиц `to` можно получить за 1 единицу `from`.
   * @throws Error если любой из тикеров не найден в БД.
   */
  getRate(pair: TickerPair): Promise<number>

  /**
   * Получить все курсы из БД.
   */
  getAllRates(): Promise<ExchangeRate[]>

  /**
   * Получить время последнего обновления курсов для указанного источника.
   *
   * @returns Наибольший updatedAt среди всех курсов source, либо null если данных нет.
   */
  getUpdateTime(source: SourceName): Promise<number | null>
}

interface FavoriteRatesDbRepositoryInterface {
  /**
   * Получить все избранные пары, отсортированные по порядку (order).
   */
  getFavoriteRates(): Promise<TickerPair[]>

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
   * Переместить пару на одну позицию вверх (уменьшить order).
   * Если пара и так первая — операция идемпотентна.
   */
  moveFavoriteRateUp(pair: TickerPair): Promise<void>

  /**
   * Переместить пару на одну позицию вниз (увеличить order).
   * Если пара и так последняя — операция идемпотентна.
   */
  moveFavoriteRateDown(pair: TickerPair): Promise<void>

  /**
   * Проверить, находится ли пара тикеров в избранном.
   */
  isFavoriteRate(pair: TickerPair): Promise<boolean>
}
