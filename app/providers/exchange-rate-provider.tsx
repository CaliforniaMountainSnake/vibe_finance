'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BinanceRepository } from '@/repositories/binance-repository'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { MoexRepository } from '@/repositories/moex-repository'
import { useDatabase } from '@/app/providers/database-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import type { SourceName } from '@/entities/exchange-rate'

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

const DEFAULT_REPOS: FinanceApiRepositoryInterface[] = [
  new CoinGeckoRepository(),
  new BinanceRepository(),
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
  repos = DEFAULT_REPOS,
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
    const tasks = repos.map((repo) => refreshSource(repo, setStatuses, databaseRepo))
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
  repo: FinanceApiRepositoryInterface,
  setStatuses: React.Dispatch<React.SetStateAction<ExchangeRateSourceStatus[]>>,
  databaseRepo: DatabaseRepositoryInterface
): Promise<void> {
  const { sourceName } = repo

  setStatuses((previous) =>
    previous.map((s) => (s.source === sourceName ? { ...s, loading: true, error: undefined } : s))
  )

  try {
    const rates = await repo.fetchRates()
    await databaseRepo.updateRatesForSource(sourceName, rates)

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
