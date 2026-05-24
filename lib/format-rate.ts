const SIGNIFICANT_DIGITS = 4
const MIN_SIGNIFICANT_DIGITS = 2
const MAX_FRACTION_DIGITS_FOR_BIG = 2
const MAGNITUDE_OFFSET = 3

/**
 * Вычисляет опции форматирования на основе порядка (магнитуды) числа.
 *
 * - rate < 1: 4 значащие цифры — защита от потери значимости
 *   для очень маленьких курсов (SHIB, сатоши, PEPE).
 * - rate ≥ 1: адаптивные десятичные знаки:
 *   1…100 → 2 знака, 100…1000 → 1 знак, > 1000 → целое.
 */
function decimalsFor(rate: number): Intl.NumberFormatOptions {
  const abs = Math.abs(rate)

  if (abs === 0) {
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
 * Форматирует курс валюты в человеко-читаемую строку.
 */
export function formatRate(rate: number): string {
  return rate.toLocaleString('ru-RU', decimalsFor(rate))
}
