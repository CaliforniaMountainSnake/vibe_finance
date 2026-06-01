const SIGNIFICANT_DIGITS = 4
const MIN_SIGNIFICANT_DIGITS = 2
const MAX_FRACTION_DIGITS_FOR_BIG = 2
const MAGNITUDE_OFFSET = 3

/**
 * Определяет опции локализованного форматирования в зависимости от величины числа.
 *
 * - Целые числа → без дробной части.
 * - |amount| < 1 → до 4 значащих цифр (защита от потери значимости для очень маленьких курсов вроде SHIB, PEPE).
 * - |amount| ≥ 1 → адаптивное число знаков после запятой:
 *   1…99 → 2 знака, 100…999 → 1 знак, ≥ 1000 → без дробной части.
 */
function decimalsFor(amount: number): Intl.NumberFormatOptions {
  const abs = Math.abs(amount)

  if (abs === 0 || Number.isInteger(abs)) {
    return { maximumFractionDigits: 0 }
  }

  if (abs < 1) {
    return {
      minimumSignificantDigits: MIN_SIGNIFICANT_DIGITS,
      maximumSignificantDigits: SIGNIFICANT_DIGITS,
    }
  }

  const fractionDigits = Math.min(
    MAX_FRACTION_DIGITS_FOR_BIG,
    Math.max(0, MAGNITUDE_OFFSET - Math.floor(Math.log10(abs)))
  )

  return {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }
}

/**
 * Форматирует число (сумму или курс) в человеко-читаемую строку.
 *
 * @param locale — BCP 47 locale tag, обязательный параметр.
 */
export function formatAmount(amount: number, locale: string): string {
  return amount.toLocaleString(locale, decimalsFor(amount))
}
