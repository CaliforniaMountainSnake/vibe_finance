import { describe, expect, it } from 'vitest'
import { DexieRepository } from '@/repositories/dexie-repository'
import { createEmptyRepo, createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { ExportProgress } from 'dexie-export-import'

interface ImportProgress {
  totalTables: number
  completedTables: number
  totalRows: number | undefined
  completedRows: number
  done: boolean
}

function compareRates(a: ExchangeRate, b: ExchangeRate): number {
  return `${a.source}:${a.ticker}`.localeCompare(`${b.source}:${b.ticker}`)
}

function sortById<T extends { id: string }>(a: T, b: T): number {
  return a.id.localeCompare(b.id)
}

async function getAllRates(repo: DatabaseRepositoryInterface): Promise<ExchangeRate[]> {
  return await repo.getAllRates()
}

async function assertEmpty(repo: DatabaseRepositoryInterface): Promise<void> {
  expect(await getAllRates(repo)).toHaveLength(0)
  expect(await repo.getFavoriteRates()).toHaveLength(0)
  expect(await repo.getHoldings()).toHaveLength(0)
}

async function assertNotEmpty(repo: DatabaseRepositoryInterface): Promise<void> {
  expect(await getAllRates(repo)).not.toHaveLength(0)
  expect(await repo.getFavoriteRates()).not.toHaveLength(0)
  expect(await repo.getHoldings()).not.toHaveLength(0)
}

/**
 * Roundtrip: populate → export → clear → import → verify all tables match.
 */
describe('Backup / Restore — кругосветка (roundtrip)', () => {
  it('полная кругосветка с данными', async () => {
    const repo = await createPopulatedRepo()

    const originalRates = await getAllRates(repo)
    const originalFavorites = await repo.getFavoriteRates()
    const originalHoldings = await repo.getHoldings()
    const originalFontSize = await repo.getSetting('fontSize')

    // после популяции данные есть
    await assertNotEmpty(repo)

    const blob = await repo.exportBackup()

    // после экспорта данные на месте (экспорт не мутирует БД)
    expect(await getAllRates(repo)).toEqual(originalRates)
    expect(await repo.getFavoriteRates()).toEqual(originalFavorites)
    expect(await repo.getHoldings()).toEqual(originalHoldings)

    await clearRepo(repo)

    // после очистки БД пуста
    await assertEmpty(repo)

    await repo.importBackup(blob)

    // после импорта данные совпадают с исходными
    const restoredRates = await getAllRates(repo)
    const restoredFavorites = await repo.getFavoriteRates()
    const restoredHoldings = await repo.getHoldings()
    const restoredFontSize = await repo.getSetting('fontSize')
    expect(restoredRates.toSorted(compareRates)).toEqual(originalRates.toSorted(compareRates))
    expect(restoredFavorites).toEqual(originalFavorites)
    expect(restoredHoldings.toSorted(sortById)).toEqual(originalHoldings.toSorted(sortById))
    expect(restoredFontSize).toBe(originalFontSize)
  })

  it('кругосветка с пустой БД', async () => {
    const repo = createEmptyRepo()
    await clearRepo(repo)
    await assertEmpty(repo)

    const blob = await repo.exportBackup()

    await clearRepo(repo)
    await repo.importBackup(blob)

    await assertEmpty(repo)
  })

  it('экспорт с прогресс-колбэком возвращает Blob', async () => {
    const repo = createEmptyRepo()
    await clearRepo(repo)
    const progressCalls: ExportProgress[] = []
    const blob = await repo.exportBackup((p) => {
      progressCalls.push(p)
      return true
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(progressCalls.length).toBeGreaterThan(0)
    expect(progressCalls.at(-1)?.done).toBe(true)
  })

  it('импорт с прогресс-колбэком вызывает колбэк', async () => {
    const repo = await createPopulatedRepo()
    await assertNotEmpty(repo)

    const blob = await repo.exportBackup()
    await clearRepo(repo)
    await assertEmpty(repo)

    const progressCalls: ImportProgress[] = []
    await repo.importBackup(blob, (p) => {
      progressCalls.push(p)
      return true
    })

    // после импорта данные восстановлены
    await assertNotEmpty(repo)
    expect(progressCalls.length).toBeGreaterThan(0)
    expect(progressCalls.at(-1)?.done).toBe(true)
  })

  it('импорт в непустую БД с clearTablesBeforeImport очищает старые данные', async () => {
    const repo1 = await createPopulatedRepo()
    const blob = await repo1.exportBackup()
    await clearRepo(repo1)

    const repo2 = new DexieRepository()
    await repo2.importBackup(blob)

    // данные импортировались в repo2 (новая БД)
    await assertNotEmpty(repo2)

    const originalRates = await getAllRates(repo1)
    const originalFavorites = await repo1.getFavoriteRates()
    const originalHoldings = await repo1.getHoldings()

    const restoredRates = await getAllRates(repo2)
    const restoredFavorites = await repo2.getFavoriteRates()
    const restoredHoldings = await repo2.getHoldings()

    expect(restoredRates.toSorted(compareRates)).toEqual(originalRates.toSorted(compareRates))
    expect(restoredFavorites).toEqual(originalFavorites)
    expect(restoredHoldings).toEqual(originalHoldings)
  })
})

describe('Backup / Restore — контроль версий', () => {
  it('отклоняет бекап с версией больше текущей', async () => {
    const repo = await createPopulatedRepo()
    const blob = await repo.exportBackup()

    // подменяем версию в бекапе на заведомо большую
    const text = await blob.text()
    const parsed = JSON.parse(text) as { data: { databaseVersion: number } }
    parsed.data.databaseVersion = 999
    const badBlob = new Blob([JSON.stringify(parsed)], { type: blob.type })

    await expect(repo.importBackup(badBlob)).rejects.toThrow('Версия базы данных в резервной копии новее')

    // данные в БД не должны пострадать
    await assertNotEmpty(repo)
  })

  it('пропускает бекап с версией равной текущей', async () => {
    const repo = await createPopulatedRepo()
    const blob = await repo.exportBackup()
    await clearRepo(repo)

    await repo.importBackup(blob)
    await assertNotEmpty(repo)
  })

  it('пропускает бекап с версией меньше текущей', async () => {
    const repo = await createPopulatedRepo()
    const blob = await repo.exportBackup()

    // подменяем версию на меньшую
    const text = await blob.text()
    const parsed = JSON.parse(text) as { data: { databaseVersion: number } }
    parsed.data.databaseVersion = 1
    const oldBlob = new Blob([JSON.stringify(parsed)], { type: blob.type })
    await clearRepo(repo)

    await repo.importBackup(oldBlob)
    await assertNotEmpty(repo)
  })
})
