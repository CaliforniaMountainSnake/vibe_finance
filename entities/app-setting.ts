import type { Ticker } from './ticker'

/**
 * Запись в таблице настроек приложения.
 * Каждая настройка — это ключ-значение.
 * Хранится в IndexedDB для персистентности между запусками.
 */
export type AppSetting = {
  /** Уникальный ключ настройки */
  key: string
  /** JSON-сериализуемое значение */
  value: unknown
}

/**
 * Известные настройки приложения и их типы.
 * Расширяется по мере появления новых настроек.
 */
export type AppSettingsMap = {
  /** Валюта, в которой подсчитывается общая стоимость портфеля */
  totalBaseTicker: Ticker | undefined
  /** Базовый размер шрифта в rem */
  fontSize: number
  /** Прямоугольные карточки (без скругления) на большом экране (≥sm) */
  cardsRectangularLarge: boolean
  /** Прямоугольные карточки (без скругления) на маленьком экране (<sm) */
  cardsRectangularSmall: boolean
  /** Убрать отступы от карточек по краям на большом экране (≥sm) */
  cardPaddingRemovedLarge: boolean
  /** Убрать отступы от карточек по краям на маленьком экране (<sm) */
  cardPaddingRemovedSmall: boolean
}
