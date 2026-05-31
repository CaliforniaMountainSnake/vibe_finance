import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TickerPair } from '@/entities/ticker-pair'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
