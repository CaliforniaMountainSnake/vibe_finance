import { describe, it, expect } from 'vitest'
import { formatRate } from '@/lib/format-rate'

describe('formatRate', () => {
  describe('ноль', () => {
    it('возвращает "0" для нуля', () => {
      expect(formatRate(0)).toBe('0')
    })
  })

  describe('числа ≤ 1 (старое поведение: 2–8 знаков)', () => {
    it('форматирует 1 с минимум 2 знаками', () => {
      expect(formatRate(1)).toBe('1,00')
    })

    it('форматирует 0.5 с минимум 2 знаками', () => {
      expect(formatRate(0.5)).toBe('0,50')
    })

    it('ограничивает 0.00002731960749285592 максимум 10 знаками', () => {
      const result = formatRate(0.00002731960749285592)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeLessThanOrEqual(10)
    })

    it('сохраняет точность для 0.0000001', () => {
      const result = formatRate(0.0000001)
      expect(result).toBe('0,0000001')
    })

    it('не обрезает сатоши-подобный курс до нуля', () => {
      const result = formatRate(0.000000123456)
      expect(result).not.toBe('0')
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.replace(/^0+/, '').length).toBeGreaterThan(0)
    })
  })

  describe('числа > 1 (2 знака после запятой)', () => {
    it('форматирует 1.5 ровно с 2 знаками', () => {
      expect(formatRate(1.5)).toBe('1,50')
    })

    it('форматирует 42.123456 ровно с 2 знаками', () => {
      const result = formatRate(42.123456)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(2)
    })

    it('округляет 99.999 до 100,00', () => {
      expect(formatRate(99.999)).toBe('100,00')
    })
  })

  describe('числа > 100 (1 знак после запятой)', () => {
    it('форматирует 100.5 ровно с 1 знаком', () => {
      expect(formatRate(100.5)).toBe('100,5')
    })

    it('форматирует 500.1234 ровно с 1 знаком', () => {
      const result = formatRate(500.1234)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(1)
    })

    it('форматирует 1000 ровно с 1 знаком (1000 не > 1000)', () => {
      const result = formatRate(1000)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(1)
    })
  })

  describe('числа > 1000 (целое)', () => {
    it('форматирует 1001 как целое', () => {
      expect(formatRate(1001)).not.toContain(',')
    })

    it('форматирует 1000000.55 как целое', () => {
      expect(formatRate(1000000.55)).not.toContain(',')
    })
  })

  describe('отрицательные числа', () => {
    it('форматирует -1 с минимум 2 знаками', () => {
      expect(formatRate(-1)).toBe('-1,00')
    })

    it('форматирует -0.5 с минимум 2 знаками', () => {
      expect(formatRate(-0.5)).toBe('-0,50')
    })

    it('форматирует -1.5 ровно с 2 знаками', () => {
      expect(formatRate(-1.5)).toBe('-1,50')
    })

    it('форматирует -150.5 ровно с 1 знаком', () => {
      const result = formatRate(-150.5)
      expect(result.startsWith('-')).toBe(true)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(1)
    })

    it('форматирует -1001 как целое', () => {
      expect(formatRate(-1001)).not.toContain(',')
    })
  })
})
