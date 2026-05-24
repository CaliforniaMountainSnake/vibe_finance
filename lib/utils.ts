import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TickerPair } from '@/entities/TickerPair'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { formatRate } from '@/lib/format-rate'

export function isCrossRate(pair: TickerPair): boolean {
  return pair.from.source !== pair.to.source
}

export function pairSourceLabel(pair: TickerPair): string {
  if (!isCrossRate(pair)) {
    return ''
  }
  return '↔ cross'
}
