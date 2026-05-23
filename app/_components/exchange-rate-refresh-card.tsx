'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { DexieRepository } from '@/repositories/DexieRepository'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import { MS_PER_SEC, relativeTime } from '@/lib/time-helpers'

type SourceStatus = {
  updatedAt: number | null
  error: string | null
  loading: boolean
}

function maxUpdatedAt(rates: ExchangeRate[]): number {
  if (rates.length === 0) {
    return Math.floor(Date.now() / MS_PER_SEC)
  }
  return Math.max(...rates.map((r) => r.updatedAt))
}

const SOURCES: SourceName[] = ['coingecko', 'binance']

const coinGeckoRepo = new CoinGeckoRepository()
const binanceRepo = new BinanceRepository()
const dbRepo = new DexieRepository()

const DEFAULT_STATUS: SourceStatus = { updatedAt: null, error: null, loading: false }

function StatusCell({ status }: { status: SourceStatus }) {
  if (status.error !== null) {
    return <span className="text-destructive">ошибка</span>
  }
  if (status.loading) {
    return 'загрузка…'
  }
  if (status.updatedAt !== null) {
    return relativeTime(status.updatedAt)
  }
  return 'ещё не обновлялось'
}

function DateCell({ status }: { status: SourceStatus }) {
  if (status.error !== null) {
    return <span className="text-destructive">{status.error}</span>
  }
  if (status.updatedAt !== null) {
    return new Date(status.updatedAt * MS_PER_SEC).toLocaleString('ru-RU')
  }
  return '—'
}

export function ExchangeRateRefreshCard() {
  const [statuses, setStatuses] = useState<Record<SourceName, SourceStatus>>({
    binance: { ...DEFAULT_STATUS },
    coingecko: { ...DEFAULT_STATUS },
  })

  useEffect(() => {
    for (const source of SOURCES) {
      void dbRepo.getUpdateTime(source).then((updatedAt) => {
        setStatuses((prev) => ({
          ...prev,
          [source]: { ...prev[source], updatedAt },
        }))
      })
    }
  }, [])

  const refreshSource = useCallback(async (source: SourceName): Promise<void> => {
    setStatuses((prev) => ({
      ...prev,
      [source]: { ...prev[source], loading: true, error: null },
    }))

    try {
      const repo = source === 'coingecko' ? coinGeckoRepo : binanceRepo
      const rates = await repo.fetchRates()
      await dbRepo.updateDataForSource(source, rates)

      setStatuses((prev) => ({
        ...prev,
        [source]: { updatedAt: maxUpdatedAt(rates), error: null, loading: false },
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setStatuses((prev) => ({
        ...prev,
        [source]: { ...prev[source], error: message, loading: false },
      }))
    }
  }, [])

  const refreshAll = useCallback(() => {
    void Promise.allSettled(SOURCES.map((source) => refreshSource(source)))
  }, [refreshSource])

  const isLoading = statuses.binance.loading || statuses.coingecko.loading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Курсы валют</CardTitle>
        <CardDescription>Обновление данных из API</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={refreshAll} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Обновление…' : 'Обновить'}
        </Button>
      </CardContent>
      <CardFooter className="block p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-t text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Источник</th>
              <th className="px-4 py-2 text-left font-medium">Дата обновления</th>
              <th className="px-4 py-2 text-left font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((source) => (
              <Fragment key={source}>
                <tr className="border-t">
                  <td className="px-4 py-2 capitalize font-medium">{source}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <DateCell status={statuses[source]} />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <StatusCell status={statuses[source]} />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </CardFooter>
    </Card>
  )
}
