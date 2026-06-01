import { describe, it, expect } from 'vitest'
import { formatAmount } from '@/lib/format-amount'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'

describe('formatAmount', () => {
  describe('ноль', () => {
    it('возвращает "0" для нуля', () => {
      expect(formatAmount(0, TEST_LOCALE)).toBe('0')
    })
  })

  describe('числа ≤ 1 (адаптивное форматирование)', () => {
    it('форматирует 1 как целое (целые числа без дробной части)', () => {
      expect(formatAmount(1, TEST_LOCALE)).toBe('1')
    })

    it('форматирует 0.5 с минимум 2 знаками', () => {
      expect(formatAmount(0.5, TEST_LOCALE)).toBe('0,50')
    })

    it('ограничивает 0.00002731960749285592 максимум 10 знаками', () => {
      const result = formatAmount(0.000_027_319_607_492_855_92, TEST_LOCALE)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBeLessThanOrEqual(10)
    })

    it('показывает минимум 2 значащие цифры для 0.0000001', () => {
      const result = formatAmount(0.000_000_1, TEST_LOCALE)
      // 4 значащие цифры: значение не обнуляется, а дополняется до минимальной значимости
      expect(result).not.toBe('0')
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.replace(/^0+/, '').length).toBeGreaterThanOrEqual(2)
    })

    it('не обрезает сатоши-подобный курс до нуля', () => {
      const result = formatAmount(0.000_000_123_456, TEST_LOCALE)
      expect(result).not.toBe('0')
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.replace(/^0+/, '').length).toBeGreaterThan(0)
    })
  })

  describe('числа > 1 (2 знака после запятой)', () => {
    it('форматирует 1.5 ровно с 2 знаками', () => {
      expect(formatAmount(1.5, TEST_LOCALE)).toBe('1,50')
    })

    it('форматирует 42.123456 ровно с 2 знаками', () => {
      const result = formatAmount(42.123_456, TEST_LOCALE)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(2)
    })

    it('округляет 99.999 до 100,00', () => {
      expect(formatAmount(99.999, TEST_LOCALE)).toBe('100,00')
    })
  })

  describe('числа > 100 (1 знак после запятой)', () => {
    it('форматирует 100.5 ровно с 1 знаком', () => {
      expect(formatAmount(100.5, TEST_LOCALE)).toBe('100,5')
    })

    it('форматирует 500.1234 ровно с 1 знаком', () => {
      const result = formatAmount(500.1234, TEST_LOCALE)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(1)
    })

    it('форматирует 1000 как целое (log10=3 → 0 знаков)', () => {
      expect(formatAmount(1000, TEST_LOCALE)).not.toContain(',')
    })
  })

  describe('числа > 1000 (целое)', () => {
    it('форматирует 1_001 как целое', () => {
      expect(formatAmount(1001, TEST_LOCALE)).not.toContain(',')
    })

    it('форматирует 1_000_000.55 как целое', () => {
      expect(formatAmount(1_000_000.55, TEST_LOCALE)).not.toContain(',')
    })
  })

  describe('отрицательные числа', () => {
    it('форматирует -1 как целое (целые числа без дробной части)', () => {
      expect(formatAmount(-1, TEST_LOCALE)).toBe('-1')
    })

    it('форматирует -0.5 с минимум 2 знаками', () => {
      expect(formatAmount(-0.5, TEST_LOCALE)).toBe('-0,50')
    })

    it('форматирует -1.5 ровно с 2 знаками', () => {
      expect(formatAmount(-1.5, TEST_LOCALE)).toBe('-1,50')
    })

    it('форматирует -150.5 ровно с 1 знаком', () => {
      const result = formatAmount(-150.5, TEST_LOCALE)
      expect(result.startsWith('-')).toBe(true)
      const decimalPart = result.split(',')[1] ?? ''
      expect(decimalPart.length).toBe(1)
    })

    it('форматирует -1_001 как целое', () => {
      expect(formatAmount(-1001, TEST_LOCALE)).not.toContain(',')
    })
  })
})
