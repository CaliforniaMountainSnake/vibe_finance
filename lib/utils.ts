import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TickerPair } from '@/entities/TickerPair'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RATE_SMALL_THRESHOLD = 0.0001
const RATE_MEDIUM_THRESHOLD = 1000
const RATE_DECIMALS_SMALL = 10
const RATE_DECIMALS_DEFAULT = 8
const RATE_DECIMALS_MEDIUM = 4
const RATE_DECIMALS_LARGE = 2

export function formatRate(rate: number): string {
  if (rate === 0) return '0'
  const abs = Math.abs(rate)
  if (abs < RATE_SMALL_THRESHOLD) {
    return rate.toLocaleString('ru-RU', {
      minimumFractionDigits: RATE_DECIMALS_LARGE,
      maximumFractionDigits: RATE_DECIMALS_SMALL,
    })
  }
  if (abs < 1) {
    return rate.toLocaleString('ru-RU', {
      minimumFractionDigits: RATE_DECIMALS_LARGE,
      maximumFractionDigits: RATE_DECIMALS_DEFAULT,
    })
  }
  if (abs < RATE_MEDIUM_THRESHOLD) {
    return rate.toLocaleString('ru-RU', {
      minimumFractionDigits: RATE_DECIMALS_LARGE,
      maximumFractionDigits: RATE_DECIMALS_MEDIUM,
    })
  }
  return rate.toLocaleString('ru-RU', {
    minimumFractionDigits: RATE_DECIMALS_LARGE,
    maximumFractionDigits: RATE_DECIMALS_LARGE,
  })
}

export function isCrossRate(pair: TickerPair): boolean {
  return pair.from.source !== pair.to.source
}

export function pairSourceLabel(pair: TickerPair): string {
  if (!isCrossRate(pair)) {
    return ''
  }
  return '↔ cross'
}
