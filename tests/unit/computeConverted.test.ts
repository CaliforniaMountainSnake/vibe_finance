import { describe, it, expect } from 'vitest'
import { computeConverted } from '@/lib/compute-converted'

describe('computeConverted', () => {
  it('возвращает undefined для rate=undefined', () => {
    expect(computeConverted(100, undefined)).toBeUndefined()
  })

  it('возвращает undefined для rate=NaN', () => {
    expect(computeConverted(100, NaN)).toBeUndefined()
  })

  it('корректно вычисляет конвертированную сумму', () => {
    const result = computeConverted(100, 2.5)
    expect(result).toBe('250')
  })

  it('корректно считает с rate=0', () => {
    const result = computeConverted(100, 0)
    expect(result).toBe('0')
  })

  it('корректно считает с дробным результатом', () => {
    const result = computeConverted(1.5, 2)
    expect(result).toBe('3')
  })
})
