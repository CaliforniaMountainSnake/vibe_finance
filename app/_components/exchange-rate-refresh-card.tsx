'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard, CardAction, CardFooter, CardHeader, CardTitle } from '@/app/_components/app-card'
import { useExchangeRate } from '@/app/providers/exchange-rate-provider'
import type { ExchangeRateSourceStatus } from '@/app/providers/exchange-rate-provider'
import { useLocale } from '@/app/providers/locale-provider'
import { useSettings } from '@/app/providers/settings-provider'
import { SourceIcon } from '@/components/icons/source-icon'
import { MS_PER_SEC, relativeTime } from '@/lib/time-helpers'
import { sourceDisplayName } from '@/lib/source-display-name'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
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

function CompactSummary({ statuses }: { statuses: ExchangeRateSourceStatus[] }) {
  const isLoading = statuses.some((s) => s.loading)
  const erroredStatuses = statuses.filter((s) => s.error !== undefined)
  const updatedAts = statuses.map((s) => s.updatedAt).filter((u): u is number => u !== undefined)

  if (isLoading) {
    return <span>Обновление…</span>
  }

  return (
    <>
      {erroredStatuses.map((s) => (
        <div key={s.source} className="text-destructive">
          {sourceDisplayName(s.source)}: {s.error}
        </div>
      ))}
      {updatedAts.length > 0 && (
        <div className="flex items-center justify-between">
          <span>Обновлено:</span>
          <span>{relativeTime(Math.min(...updatedAts))}</span>
        </div>
      )}
      {updatedAts.length === 0 && erroredStatuses.length === 0 && <span>ещё не обновлялось</span>}
    </>
  )
}

type ExchangeRateRefreshCardProperties = {
  onRefreshed?: () => void
  onRestored?: () => void
  compactRefreshCard?: boolean
}

const RELATIVE_TIME_UPDATE_INTERVAL_MS = 30_000

function CardToggleButton({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onToggle} variant="outline" size="icon" aria-label={isCollapsed ? 'Развернуть' : 'Свернуть'}>
          {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isCollapsed ? 'Развернуть' : 'Свернуть'}</TooltipContent>
    </Tooltip>
  )
}

function CardActions({
  showToggle,
  isCollapsed,
  onToggle,
  isLoading,
  onRefresh,
  onRestored,
}: {
  showToggle: boolean
  isCollapsed: boolean
  onToggle: () => void
  isLoading: boolean
  onRefresh: () => void
  onRestored?: () => void
}) {
  return (
    <CardAction className="flex items-center gap-2">
      {showToggle ? <CardToggleButton isCollapsed={isCollapsed} onToggle={onToggle} /> : undefined}
      <SettingsDialog onRestored={onRestored} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="icon" aria-label="Обновить курсы">
            <RefreshCw className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isLoading ? 'Обновление…' : 'Обновить'}</TooltipContent>
      </Tooltip>
    </CardAction>
  )
}

function CardBody({ isCollapsed, statuses }: { isCollapsed: boolean; statuses: ExchangeRateSourceStatus[] }) {
  if (isCollapsed) {
    return (
      <div className="px-4 py-3 text-sm">
        <CompactSummary statuses={statuses} />
      </div>
    )
  }
  return <SourcesStatusTable statuses={statuses} />
}

export function ExchangeRateRefreshCard({
  onRefreshed,
  onRestored,
  compactRefreshCard: compactOverride,
}: ExchangeRateRefreshCardProperties) {
  const { sourceStatuses, refreshAll, isLoading } = useExchangeRate()
  const { compactRefreshCard: compactSetting } = useSettings()
  const effectiveCompact = compactOverride === undefined ? compactSetting : compactOverride

  const [expanded, setExpanded] = useState(false)
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

  const handleToggleExpand = useCallback(() => {
    setExpanded((v) => !v)
  }, [])

  const isCollapsed = effectiveCompact && !expanded

  return (
    <AppCard>
      <CardHeader>
        <CardTitle>Данные API</CardTitle>
        <CardActions
          showToggle={effectiveCompact}
          isCollapsed={isCollapsed}
          onToggle={handleToggleExpand}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onRestored={onRestored}
        />
      </CardHeader>
      <CardFooter className="block p-0">
        <CardBody isCollapsed={isCollapsed} statuses={sourceStatuses} />
      </CardFooter>
    </AppCard>
  )
}
