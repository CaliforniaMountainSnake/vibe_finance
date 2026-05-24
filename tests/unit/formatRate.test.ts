import { describe, it, expect } from 'vitest'
import { formatRate } from '@/lib/format-rate'

describe('formatRate', () => {
  describe('ноль', () => {
    it('возвращает "0" для нуля', () => {
      expect(formatRate(0)).toBe('0')
    })
  })

  describe('очень маленькие числа (< 0.0001)', () => {
    it('форматирует 0.00000001 с 2–10 знаками', () => {
      const result = formatRate(0.00000001)
      // Должно быть не меньше 2 знаков после запятой
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(10)
    })

    it('форматирует 0.00009999 с 2–10 знаками', () => {
      const result = formatRate(0.00009999)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(10)
    })
  })

  describe('маленькие числа (>= 0.0001 и < 1)', () => {
    it('форматирует 0.0001 с 2–8 знаками', () => {
      const result = formatRate(0.0001)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(8)
    })

    it('форматирует 0.5 с 2–8 знаками', () => {
      const result = formatRate(0.5)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(8)
    })

    it('форматирует 0.9999 с 2–8 знаками', () => {
      const result = formatRate(0.9999)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(8)
    })
  })

  describe('средние числа (>= 1 и < 1000)', () => {
    it('форматирует 1 с 2–4 знаками', () => {
      const result = formatRate(1)
      // 1 → "1,00"
      expect(result).toBe('1,00')
    })

    it('форматирует 42.123456 с 2–4 знаками', () => {
      const result = formatRate(42.123456)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(4)
    })

    it('форматирует 999.9999 с 2–4 знаками', () => {
      const result = formatRate(999.9999)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(4)
    })
  })

  describe('большие числа (>= 1000)', () => {
    it('форматирует 1000 ровно с 2 знаками', () => {
      expect(formatRate(1000)).toBe('1\u00a0000,00')
    })

    it('форматирует 1000000.55 ровно с 2 знаками', () => {
      const result = formatRate(1000000.55)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(2)
    })
  })

  describe('отрицательные числа', () => {
    it('форматирует -1 как "-1,00"', () => {
      expect(formatRate(-1)).toBe('-1,00')
    })

    it('форматирует -0.5 с 2–8 знаками', () => {
      const result = formatRate(-0.5)
      expect(result.startsWith('-')).toBe(true)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeGreaterThanOrEqual(2)
      expect(decimalPart.length).toBeLessThanOrEqual(8)
    })

    it('форматирует -1000 ровно с 2 знаками', () => {
      expect(formatRate(-1000)).toBe('-1\u00a0000,00')
    })
  })

  describe('NaN и специальные случаи', () => {
    it('возвращает строку для очень маленького числа без потери точности', () => {
      // Например, сатоши-подобные курсы
      const result = formatRate(0.000000123456)
      expect(result).not.toBe('0')
      // Не должен обрезаться до нуля
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.replace(/^0+/, '').length).toBeGreaterThan(0)
    })
  })
})
