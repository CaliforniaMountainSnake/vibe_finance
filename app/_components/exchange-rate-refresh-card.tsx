'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BinanceRepository } from '@/repositories/binance-repository'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { MoexRepository } from '@/repositories/moex-repository'
import { useDatabase } from '@/app/providers/database-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { ExchangeRate, SourceName } from '@/entities/exchange-rate'
import { SourceIcon } from '@/components/icons/source-icon'
import { MS_PER_SEC, relativeTime } from '@/lib/time-helpers'
import { sourceDisplayName } from '@/lib/source-display-name'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw } from 'lucide-react'
import { SettingsDialog } from './settings-dialog'

type SourceStatus = {
  updatedAt: number | undefined
  error: string | undefined
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

const DEFAULT_STATUS: SourceStatus = { updatedAt: undefined, error: undefined, loading: false }
const RELATIVE_TIME_UPDATE_INTERVAL_MS = 30_000

function StatusCell({ status }: { status: SourceStatus }) {
  if (status.error !== undefined) {
    return <span className="text-destructive">ошибка</span>
  }
  if (status.loading) {
    return 'загрузка…'
  }
  if (status.updatedAt !== undefined) {
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
  if (status.error !== undefined) {
    return <span className="text-destructive">{status.error}</span>
  }
  if (status.updatedAt !== undefined) {
    return formatDate(status.updatedAt)
  }
  return '—'
}

function SourcesStatusTable({ statuses }: { statuses: Record<SourceName, SourceStatus> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Источник</TableHead>
          <TableHead>Дата обновления</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SOURCES.map((source) => (
          <Fragment key={source}>
            <TableRow>
              <TableCell className="capitalize font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <SourceIcon source={source} className="size-3.5 text-muted-foreground" />
                  {sourceDisplayName(source)}
                </span>
              </TableCell>
              <TableCell>
                <DateCell status={statuses[source]} />
              </TableCell>
              <TableCell>
                <StatusCell status={statuses[source]} />
              </TableCell>
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    </Table>
  )
}

type ExchangeRateRefreshCardProperties = {
  onRefreshed?: () => void
}

function selectRepo(source: SourceName): CoinGeckoRepository | BinanceRepository | MoexRepository {
  if (source === 'coingecko') return coinGeckoRepo
  if (source === 'moex') return moexRepo
  return binanceRepo
}

async function refreshSource(
  source: SourceName,
  setStatuses: React.Dispatch<React.SetStateAction<Record<SourceName, SourceStatus>>>,
  databaseRepo: DatabaseRepositoryInterface
): Promise<void> {
  setStatuses((previous) => ({
    ...previous,
    [source]: { ...previous[source], loading: true, error: undefined },
  }))

  try {
    const repo = selectRepo(source)
    const rates = await repo.fetchRates()
    await databaseRepo.updateRatesForSource(source, rates)

    setStatuses((previous) => ({
      ...previous,
      [source]: { updatedAt: maxUpdatedAt(rates), error: undefined, loading: false },
    }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    setStatuses((previous) => ({
      ...previous,
      [source]: { ...previous[source], error: message, loading: false },
    }))
  }
}

export function ExchangeRateRefreshCard({ onRefreshed }: ExchangeRateRefreshCardProperties) {
  const databaseRepo = useDatabase()
  const [statuses, setStatuses] = useState<Record<SourceName, SourceStatus>>({
    binance: { ...DEFAULT_STATUS },
    coingecko: { ...DEFAULT_STATUS },
    moex: { ...DEFAULT_STATUS },
  })

  const [, setTick] = useState(0)

  useEffect(() => {
    for (const source of SOURCES) {
      void databaseRepo.getUpdateTime(source).then((updatedAt) => {
        setStatuses((previous) => ({
          ...previous,
          [source]: { ...previous[source], updatedAt },
        }))
      })
    }
  }, [databaseRepo])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, RELATIVE_TIME_UPDATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const refreshAll = useCallback(() => {
    void Promise.allSettled(SOURCES.map((source) => refreshSource(source, setStatuses, databaseRepo))).then(() => {
      onRefreshed?.()
    })
  }, [onRefreshed, databaseRepo])

  const isLoading = statuses.binance.loading || statuses.coingecko.loading

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные API</CardTitle>
        <CardAction className="flex items-center gap-2">
          <SettingsDialog />
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
