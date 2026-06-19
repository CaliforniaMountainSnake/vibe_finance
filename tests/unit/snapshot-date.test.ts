import { describe, it, expect } from 'vitest'
import { makeSnapshotKey } from '@/lib/snapshot-date'

describe('toSnapshotDate', () => {
  it('returns YYYY-MM-DD for a UTC date', () => {
    expect(makeSnapshotKey(new Date('2026-06-19T00:00:00Z'))).toBe('2026-06-19')
  })

  it('returns the same date for any time within the same UTC day', () => {
    expect(makeSnapshotKey(new Date('2026-06-19T23:59:59Z'))).toBe('2026-06-19')
    expect(makeSnapshotKey(new Date('2026-06-19T00:00:01Z'))).toBe('2026-06-19')
  })

  it('adjusts date when input has a timezone offset', () => {
    const date = new Date('2026-06-19T00:00:00+03:00')
    expect(makeSnapshotKey(date)).toBe('2026-06-18')
  })

  it('handles year boundary', () => {
    expect(makeSnapshotKey(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-31')
    expect(makeSnapshotKey(new Date('2027-01-01T00:00:00Z'))).toBe('2027-01-01')
  })

  it('handles leap year date', () => {
    expect(makeSnapshotKey(new Date('2024-02-29T12:00:00Z'))).toBe('2024-02-29')
  })

  it('pads single-digit month and day with zero', () => {
    expect(makeSnapshotKey(new Date('2026-01-05T00:00:00Z'))).toBe('2026-01-05')
    expect(makeSnapshotKey(new Date('2026-03-01T00:00:00Z'))).toBe('2026-03-01')
  })
})
