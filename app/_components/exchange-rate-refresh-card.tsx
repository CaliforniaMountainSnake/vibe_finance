'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard, CardAction, CardFooter, CardHeader, CardTitle } from '@/app/_components/app-card'
import { useExchangeRate } from '@/app/providers/exchange-rate-provider'
import type { ExchangeRateSourceStatus } from '@/app/providers/exchange-rate-provider'
import { useLocale } from '@/app/providers/locale-provider'
import { SourceIcon } from '@/components/icons/source-icon'
import { MS_PER_SEC, relativeTime } from '@/lib/time-helpers'
import { sourceDisplayName } from '@/lib/source-display-name'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw } from 'lucide-react'
import { SettingsDialog } from './settings-dialog'

function StatusCell({ status }: { status: ExchangeRateSourceStatus }) {
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

function DateCell({ status, locale }: { status: ExchangeRateSourceStatus; locale: string }) {
  if (status.error !== undefined) {
    return <span className="text-destructive">{status.error}</span>
  }
  if (status.updatedAt !== undefined) {
    const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return dateTimeFormatter.format(new Date(status.updatedAt * MS_PER_SEC))
  }
  return '—'
}

function SourcesStatusTable({ statuses }: { statuses: ExchangeRateSourceStatus[] }) {
  const locale = useLocale()
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
        {statuses.map((status) => (
          <Fragment key={status.source}>
            <TableRow>
              <TableCell className="capitalize font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <SourceIcon source={status.source} className="size-3.5 text-muted-foreground" />
                  {sourceDisplayName(status.source)}
                </span>
              </TableCell>
              <TableCell>
                <DateCell status={status} locale={locale} />
              </TableCell>
              <TableCell>
                <StatusCell status={status} />
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

const RELATIVE_TIME_UPDATE_INTERVAL_MS = 30_000

export function ExchangeRateRefreshCard({ onRefreshed }: ExchangeRateRefreshCardProperties) {
  const { sourceStatuses, refreshAll, isLoading } = useExchangeRate()

  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, RELATIVE_TIME_UPDATE_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    void refreshAll().then(() => {
      onRefreshed?.()
    })
  }, [refreshAll, onRefreshed])

  return (
    <AppCard>
      <CardHeader>
        <CardTitle>Данные API</CardTitle>
        <CardAction className="flex items-center gap-2">
          <SettingsDialog />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleRefresh}
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
        <SourcesStatusTable statuses={sourceStatuses} />
      </CardFooter>
    </AppCard>
  )
}
