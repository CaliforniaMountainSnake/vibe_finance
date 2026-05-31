import { type ExchangeRate, type SourceName } from '@/entities/exchange-rate'
import { type TickerPair } from '@/entities/ticker-pair'
import { type Holding, type HoldingUpdate } from '@/entities/holding'
import { type Ticker } from '@/entities/ticker'
import { type AppSettingsMap } from '@/entities/app-setting'

/**
 * Контракт репозитория для локального хранения курсов валют в IndexedDB.
 */
export interface DatabaseRepositoryInterface
  extends
    ExchangeRatesDatabaseRepositoryInterface,
    FavoriteRatesDatabaseRepositoryInterface,
    HoldingsDatabaseRepositoryInterface,
    SettingsDatabaseRepositoryInterface {
  /**
   * Очистить всю базу
   */
  clearAll(): Promise<void>
}

interface ExchangeRatesDatabaseRepositoryInterface {
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

interface FavoriteRatesDatabaseRepositoryInterface {
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

/**
 * Контракт для работы с холдингами (средствами пользователя в разных валютах).
 */
export interface HoldingsDatabaseRepositoryInterface {
  /**
   * Получить все холдинги, отсортированные по order (0 — первый).
   */
  getHoldings(): Promise<Holding[]>

  /**
   * Добавить новый холдинг.
   * Новый холдинг получает order = max+1 и enabled = true.
   */
  addHolding(ticker: Ticker, amount: number, label: string): Promise<void>

  /**
   * Частично обновить поля холдинга.
   * Передаются только те поля, которые нужно изменить (см. HoldingUpdate).
   */
  updateHolding(id: string, updates: HoldingUpdate): Promise<void>

  /**
   * Удалить холдинг по id.
   * Если холдинга с таким id нет — операция идемпотентна.
   */
  removeHolding(id: string): Promise<void>

  /**
   * Переместить холдинг на одну позицию вверх (уменьшить order).
   * Если холдинг уже первый — операция идемпотентна.
   */
  moveHoldingUp(id: string): Promise<void>

  /**
   * Переместить холдинг на одну позицию вниз (увеличить order).
   * Если холдинг уже последний — операция идемпотентна.
   */
  moveHoldingDown(id: string): Promise<void>
}

/**
 * Контракт для работы с пользовательскими настройками.
 * Настройки хранятся как key-value пары в IndexedDB.
 */
export interface SettingsDatabaseRepositoryInterface {
  /**
   * Получить значение настройки по ключу.
   * Возвращает undefined, если настройка не установлена.
   */
  getSetting<K extends keyof AppSettingsMap>(key: K): Promise<AppSettingsMap[K] | undefined>

  /**
   * Сохранить значение настройки.
   */
  setSetting<K extends keyof AppSettingsMap>(key: K, value: AppSettingsMap[K]): Promise<void>

  /**
   * Удалить настройку.
   * Если настройки с таким ключом нет — операция идемпотентна.
   */
  removeSetting(key: string): Promise<void>
}
