'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BinanceRepository } from '@/repositories/binance-repository'
import { BybitRepository } from '@/repositories/bybit-repository'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { MoexRepository } from '@/repositories/moex-repository'
import { useDatabase } from '@/app/providers/database-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import type { SourceName } from '@/entities/exchange-rate'
import type { ExchangeRateSnapshot } from '@/entities/exchange-rate-snapshot'
import { makeSnapshotKey } from '@/lib/snapshot-date'

/** Статус одного источника: дата обновления, ошибка, флаг загрузки. */
export type ExchangeRateSourceStatus = {
  source: SourceName
  updatedAt: number | undefined
  error: string | undefined
  loading: boolean
}

type ExchangeRateContextValue = {
  sourceStatuses: ExchangeRateSourceStatus[]
  refreshAll: () => Promise<void>
  isLoading: boolean
}

const DEFAULT_FINANCE_REPOS: FinanceApiRepositoryInterface[] = [
  new CoinGeckoRepository(),
  new BinanceRepository(),
  new BybitRepository(),
  new MoexRepository(),
]

const ExchangeRateContext = createContext<ExchangeRateContextValue | undefined>(undefined)

export function useExchangeRate(): ExchangeRateContextValue {
  const context = useContext(ExchangeRateContext)
  if (context === undefined) {
    throw new Error('useExchangeRate must be used within an ExchangeRateProvider')
  }
  return context
}

function buildInitialStatus(source: SourceName): ExchangeRateSourceStatus {
  return { source, updatedAt: undefined, error: undefined, loading: false }
}

export function ExchangeRateProvider({
  repos = DEFAULT_FINANCE_REPOS,
  children,
}: {
  repos?: FinanceApiRepositoryInterface[]
  children: React.ReactNode
}) {
  const databaseRepo = useDatabase()

  const [statuses, setStatuses] = useState<ExchangeRateSourceStatus[]>(() =>
    repos.map((r) => buildInitialStatus(r.sourceName))
  )

  // Загружаем даты последних обновлений из БД при mount
  useEffect(() => {
    for (const repo of repos) {
      void databaseRepo.getUpdateTime(repo.sourceName).then((updatedAt) => {
        applyUpdateTime(repo.sourceName, updatedAt, setStatuses)
      })
    }
  }, [databaseRepo, repos])

  const refreshAll = useCallback(async () => {
    const tasks = repos.map((financeRepo) => refreshSource(financeRepo, databaseRepo, setStatuses))
    await Promise.allSettled(tasks)
  }, [repos, databaseRepo])

  const isLoading = statuses.some((s) => s.loading)

  const value = useMemo<ExchangeRateContextValue>(
    () => ({ sourceStatuses: statuses, refreshAll, isLoading }),
    [statuses, refreshAll, isLoading]
  )

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>
}

async function refreshSource(
  financeRepo: FinanceApiRepositoryInterface,
  databaseRepo: DatabaseRepositoryInterface,
  setStatuses: React.Dispatch<React.SetStateAction<ExchangeRateSourceStatus[]>>
): Promise<void> {
  const { sourceName } = financeRepo

  setStatuses((previous) =>
    previous.map((s) => (s.source === sourceName ? { ...s, loading: true, error: undefined } : s))
  )

  try {
    const rates = await financeRepo.fetchRates()
    await databaseRepo.updateRatesForSource(sourceName, rates)

    const today = makeSnapshotKey(new Date())
    const snapshots: ExchangeRateSnapshot[] = rates.map((r) => ({
      date: today,
      source: r.source,
      ticker: r.ticker,
      btcPrice: r.btcPrice,
    }))
    await databaseRepo.saveSnapshot(snapshots)

    const updatedAt = rates.length > 0 ? Math.max(...rates.map((r) => r.updatedAt)) : undefined

    setStatuses((previous) =>
      previous.map((s) => (s.source === sourceName ? { ...s, error: undefined, loading: false, updatedAt } : s))
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    setStatuses((previous) =>
      previous.map((s) => (s.source === sourceName ? { ...s, error: message, loading: false } : s))
    )
  }
}

function applyUpdateTime(
  source: SourceName,
  updatedAt: number | null,
  setStatuses: React.Dispatch<React.SetStateAction<ExchangeRateSourceStatus[]>>
): void {
  setStatuses((previous) =>
    previous.map((s) => (s.source === source ? { ...s, updatedAt: updatedAt ?? undefined } : s))
  )
}
