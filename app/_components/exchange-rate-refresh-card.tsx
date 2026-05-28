'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BinanceRepository } from '@/repositories/BinanceRepository'
import { CoinGeckoRepository } from '@/repositories/CoinGeckoRepository'
import { MoexRepository } from '@/repositories/MoexRepository'
import { DexieRepository } from '@/repositories/DexieRepository'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import { SourceIcon } from '@/components/icons/source-icon'
import { MS_PER_SEC, relativeTime } from '@/lib/time-helpers'
import { sourceDisplayName } from '@/lib/source-display-name'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw } from 'lucide-react'

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

const SOURCES: SourceName[] = ['coingecko', 'binance', 'moex']

const coinGeckoRepo = new CoinGeckoRepository()
const binanceRepo = new BinanceRepository()
const moexRepo = new MoexRepository()
const dbRepo = new DexieRepository()

const DEFAULT_STATUS: SourceStatus = { updatedAt: null, error: null, loading: false }
const RELATIVE_TIME_UPDATE_INTERVAL_MS = 30_000

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

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(ts: number): string {
  return dateTimeFormatter.format(new Date(ts * MS_PER_SEC))
}

function DateCell({ status }: { status: SourceStatus }) {
  if (status.error !== null) {
    return <span className="text-destructive">{status.error}</span>
  }
  if (status.updatedAt !== null) {
    return formatDate(status.updatedAt)
  }
  return '—'
}

function SourcesStatusTable({ statuses }: { statuses: Record<SourceName, SourceStatus> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-t bg-muted/30">
          <th className="px-1.5 py-1.5 text-left text-foreground text-xs font-medium">Источник</th>
          <th className="px-1.5 py-1.5 text-left text-foreground text-xs font-medium">Дата обновления</th>
          <th className="px-1.5 py-1.5 text-left text-foreground text-xs font-medium">Статус</th>
        </tr>
      </thead>
      <tbody>
        {SOURCES.map((source) => (
          <Fragment key={source}>
            <tr className="border-t">
              <td className="px-1.5 py-1.5 capitalize font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <SourceIcon source={source} className="size-3.5 text-muted-foreground" />
                  {sourceDisplayName(source)}
                </span>
              </td>
              <td className="px-1.5 py-1.5">
                <DateCell status={statuses[source]} />
              </td>
              <td className="px-1.5 py-1.5">
                <StatusCell status={statuses[source]} />
              </td>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}

type ExchangeRateRefreshCardProps = {
  onRefreshed?: () => void
}

export function ExchangeRateRefreshCard({ onRefreshed }: ExchangeRateRefreshCardProps) {
  const [statuses, setStatuses] = useState<Record<SourceName, SourceStatus>>({
    binance: { ...DEFAULT_STATUS },
    coingecko: { ...DEFAULT_STATUS },
    moex: { ...DEFAULT_STATUS },
  })

  const [, setTick] = useState(0)

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, RELATIVE_TIME_UPDATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const refreshSource = useCallback(async (source: SourceName): Promise<void> => {
    setStatuses((prev) => ({
      ...prev,
      [source]: { ...prev[source], loading: true, error: null },
    }))

    try {
      let repo: CoinGeckoRepository | BinanceRepository | MoexRepository
      if (source === 'coingecko') repo = coinGeckoRepo
      else if (source === 'moex') repo = moexRepo
      else repo = binanceRepo
      const rates = await repo.fetchRates()
      await dbRepo.updateRatesForSource(source, rates)

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
    void Promise.allSettled(SOURCES.map((source) => refreshSource(source))).then(() => {
      onRefreshed?.()
    })
  }, [refreshSource, onRefreshed])

  const isLoading = statuses.binance.loading || statuses.coingecko.loading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные API</CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={refreshAll}
                disabled={isLoading}
                variant="outline"
                size="icon"
                aria-label="Обновить курсы"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isLoading ? 'Обновление…' : 'Обновить'}</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardFooter className="block p-0">
        <SourcesStatusTable statuses={statuses} />
      </CardFooter>
    </Card>
  )
}
