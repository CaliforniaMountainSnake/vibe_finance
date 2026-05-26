/**
 * Внутренние типы для парсинга ответов API МосБиржи.
 *
 * MOEX ISS возвращает данные в формате «колонки + строки»:
 * { columns: [...], data: [[val1, val2, ...], ...] }
 */

/** Формат «колонки + строки», который использует MOEX ISS API. */
export type MoexColumnarData = {
  /** Имена колонок, например ["SECID", "WAPRICE"]. */
  columns: string[]
  /** Массив строк; каждая строка — массив значений в порядке columns. */
  data: (string | number | null)[][]
}

/** Структура ответа MOEX ISS: securities + marketdata. */
export type MoexResponse = {
  /** Справочные данные по инструментам (SECID, SECNAME и т.д.). */
  securities: MoexColumnarData
  /** Рыночные данные (цены, обороты и т.д.). */
  marketdata: MoexColumnarData
}

/** Валютный курс, выраженный в RUB. */
export type CurrencyRateInfo = {
  /** Тикер валюты в нижнем регистре (usd, cny, gld). */
  ticker: string
  /** Цена 1 единицы валюты в RUB. */
  priceInRub: number
  /** Символ единицы измерения (₽, $, ¥, Au и т.д.). */
  unit: string
  /** Человекочитаемое название инструмента (необязательно). */
  name?: string
}
