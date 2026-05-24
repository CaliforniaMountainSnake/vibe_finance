/* eslint-disable no-magic-numbers, complexity */

function decimalsFor(rate: number): { min: number; max: number } {
  if (rate === 0) return { min: 0, max: 0 }
  const abs = Math.abs(rate)
  if (abs > 1000) return { min: 0, max: 0 }
  if (abs > 100) return { min: 1, max: 1 }
  if (abs > 1) return { min: 2, max: 2 }
  if (abs < 0.0001) return { min: 2, max: 10 }
  return { min: 2, max: 8 }
}

export function formatRate(rate: number): string {
  if (rate === 0) return '0'
  const { min, max } = decimalsFor(rate)
  return rate.toLocaleString('ru-RU', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  })
}
