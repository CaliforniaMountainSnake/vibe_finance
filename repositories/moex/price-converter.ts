import type { CurrencyRateInfo } from './types'

/**
 * Строит маппинг: тикер валюты (верхний регистр) → цена 1 единицы в RUB.
 */
export function buildCurrencyToRubMap(rates: CurrencyRateInfo[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const rate of rates) {
    map.set(rate.ticker.toUpperCase(), rate.priceInRub)
  }
  return map
}

/** Параметры конвертации цены в формат «X per BTC». */
type ConvertParameters = {
  /** Цена инструмента в оригинальной валюте. */
  priceInCurrency: number
  /** Код валюты цены (RUB, USD, EUR, CNY). */
  currency: string
  /** Маппинг валют → цена в RUB (для кросс-конвертации). */
  currencyToRub: Map<string, number>
  /** Цена 1 BTC в RUB. */
  btcRub: number
}

/**
 * Конвертирует цену инструмента в произвольной валюте
 * в формат «X per BTC» (сколько единиц X стоит 1 BTC).
 *
 * Формула: btcPrice = btcRub / priceInRub.
 * Если валюта отлична от RUB, сначала переводим price в RUB.
 *
 * @returns btcPrice или null, если курс валюты неизвестен.
 */
export function convertToBtcPrice(parameters: ConvertParameters): number | undefined {
  const { priceInCurrency, currency, currencyToRub, btcRub } = parameters
  const currentUpper = currency.toUpperCase()

  // Если валюта — RUB, конвертим напрямую
  if (currentUpper === 'RUB') {
    return btcRub / priceInCurrency
  }

  // Иначе: переводим цену в RUB и делим btcRub на неё
  const currentRubRate = currencyToRub.get(currentUpper)
  if (currentRubRate === undefined) return undefined

  const priceInRub = priceInCurrency * currentRubRate
  if (priceInRub <= 0) return undefined

  return btcRub / priceInRub
}
