import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  relativeTime,
  SEC_PER_MINUTE,
  SEC_PER_HOUR,
  SEC_PER_DAY,
  SEC_PER_MONTH,
  SEC_PER_YEAR,
  MS_PER_SEC,
} from '@/lib/time-helpers'

/**
 * Возвращает timestamp в прошлом: now - diffSeconds
 */
function pastTs(diffSeconds: number): number {
  const now = Math.floor(Date.now() / MS_PER_SEC)
  return now - diffSeconds
}

describe('relativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('секунды', () => {
    it('0 секунд — выводит "0 сек. назад"', () => {
      expect(relativeTime(pastTs(0))).toBe('0 сек. назад')
    })

    it('1 секунда — выводит "1 сек. назад"', () => {
      expect(relativeTime(pastTs(1))).toBe('1 сек. назад')
    })

    it('30 секунд — выводит "30 сек. назад"', () => {
      expect(relativeTime(pastTs(30))).toBe('30 сек. назад')
    })

    it('59 секунд — выводит "59 сек. назад"', () => {
      expect(relativeTime(pastTs(59))).toBe('59 сек. назад')
    })
  })

  describe('минуты', () => {
    it('ровно 1 минута — выводит "1 мин. назад"', () => {
      expect(relativeTime(pastTs(SEC_PER_MINUTE))).toBe('1 мин. назад')
    })

    it('2 минуты — выводит "2 мин. назад"', () => {
      expect(relativeTime(pastTs(2 * SEC_PER_MINUTE))).toBe('2 мин. назад')
    })

    it('30 минут — выводит "30 мин. назад"', () => {
      expect(relativeTime(pastTs(30 * SEC_PER_MINUTE))).toBe('30 мин. назад')
    })

    it('59 минут — выводит "59 мин. назад"', () => {
      expect(relativeTime(pastTs(59 * SEC_PER_MINUTE))).toBe('59 мин. назад')
    })

    it('граница секунд/минут: ровно 60 секунд', () => {
      expect(relativeTime(pastTs(SEC_PER_MINUTE))).toBe('1 мин. назад')
    })
  })

  describe('часы', () => {
    it('ровно 1 час — выводит "1 ч. назад"', () => {
      expect(relativeTime(pastTs(SEC_PER_HOUR))).toBe('1 ч. назад')
    })

    it('2 часа — выводит "2 ч. назад"', () => {
      expect(relativeTime(pastTs(2 * SEC_PER_HOUR))).toBe('2 ч. назад')
    })

    it('23 часа — выводит "23 ч. назад"', () => {
      expect(relativeTime(pastTs(23 * SEC_PER_HOUR))).toBe('23 ч. назад')
    })

    it('граница минут/часов: ровно 3600 секунд', () => {
      expect(relativeTime(pastTs(SEC_PER_HOUR))).toBe('1 ч. назад')
    })
  })

  describe('дни', () => {
    it('ровно 1 день — выводит "1 дн. назад"', () => {
      expect(relativeTime(pastTs(SEC_PER_DAY))).toBe('1 дн. назад')
    })

    it('2 дня — выводит "2 дн. назад"', () => {
      expect(relativeTime(pastTs(2 * SEC_PER_DAY))).toBe('2 дн. назад')
    })

    it('29 дней — выводит "29 дн. назад"', () => {
      expect(relativeTime(pastTs(29 * SEC_PER_DAY))).toBe('29 дн. назад')
    })

    it('граница часов/дней: ровно 86400 секунд', () => {
      expect(relativeTime(pastTs(SEC_PER_DAY))).toBe('1 дн. назад')
    })
  })

  describe('месяцы', () => {
    it('ровно 30 дней — выводит "1 мес. назад"', () => {
      expect(relativeTime(pastTs(SEC_PER_MONTH))).toBe('1 мес. назад')
    })

    it('2 месяца — выводит "2 мес. назад"', () => {
      expect(relativeTime(pastTs(2 * SEC_PER_MONTH))).toBe('2 мес. назад')
    })

    it('11 месяцев — выводит "11 мес. назад"', () => {
      expect(relativeTime(pastTs(11 * SEC_PER_MONTH))).toBe('11 мес. назад')
    })

    it('граница дней/месяцев: ровно 2592000 секунд', () => {
      expect(relativeTime(pastTs(SEC_PER_MONTH))).toBe('1 мес. назад')
    })
  })

  describe('годы', () => {
    it('ровно 365 дней — выводит "1 г. назад"', () => {
      expect(relativeTime(pastTs(SEC_PER_YEAR))).toBe('1 г. назад')
    })

    it('2 года — выводит "2 г. назад"', () => {
      expect(relativeTime(pastTs(2 * SEC_PER_YEAR))).toBe('2 г. назад')
    })

    it('10 лет — выводит "10 г. назад"', () => {
      expect(relativeTime(pastTs(10 * SEC_PER_YEAR))).toBe('10 г. назад')
    })
  })

  describe('отрицательный diff (будущее)', () => {
    it('ts в будущем на 10 секунд — выводит "-10 сек. назад"', () => {
      const futureTs = Math.floor(Date.now() / 1000) + 10
      expect(relativeTime(futureTs)).toBe('-10 сек. назад')
    })
  })
})
