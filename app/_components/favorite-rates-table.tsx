'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SourceName } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatAmount } from '@/lib/format-amount'
import { sourceDisplayName } from '@/lib/source-display-name'
import { ConfirmRemoveButton } from './confirm-remove-button'
import { FavoriteRowActionsDropdown } from './favorite-row-actions-dropdown'

/* ── Helpers ──────────────────────────────────────────────────── */

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
}

/* ── Sub-components ──────────────────────────────────────────── */

function TickerName({ ticker }: { ticker: Ticker }) {
  const label = <span className="font-medium text-sm uppercase">{ticker.ticker}</span>

  if (!ticker.name) {
    return label
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent side="top">{ticker.name}</TooltipContent>
    </Tooltip>
  )
}

function SourceIconWithTooltip({ source }: { source: SourceName }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <SourceIcon source={source} className="size-3.5 shrink-0 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{sourceDisplayName(source)}</TooltipContent>
    </Tooltip>
  )
}

function rateTooltipContent(
  rate: number | undefined,
  suffix: string,
  toName: string | undefined
): React.ReactNode | null {
  if (rate === undefined || isNaN(rate)) {
    if (toName) return toName
    return null
  }
  return (
    <>
      <div>
        ≈ {rate.toString()} {suffix}
      </div>
      {toName && <div className="text-muted-foreground">{toName}</div>}
    </>
  )
}

function FormatRate({
  rate,
  unit,
  ticker,
  toName,
  toSource,
}: {
  rate: number | undefined
  unit: string | undefined
  ticker: string
  toName: string | undefined
  toSource: SourceName
}) {
  const isValid = rate !== undefined && !isNaN(rate)
  const displayRate = isValid ? formatAmount(rate) : '\u2014'
  const suffix = unit ?? ticker.toUpperCase()
  const tooltip = rateTooltipContent(rate, suffix, toName)

  const rateNode = <span className="text-sm tabular-nums">{displayRate}</span>

  return (
    <div className="flex items-center justify-end gap-1">
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{rateNode}</TooltipTrigger>
          <TooltipContent side="top" className="flex-col items-start">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        rateNode
      )}
      <span className="text-muted-foreground text-sm">{suffix}</span>
      <SourceIconWithTooltip source={toSource} />
    </div>
  )
}

function ReorderButtons({
  pair,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  pair: TickerPair
  isFirst: boolean
  isLast: boolean
  onMoveUp: (pair: TickerPair) => void
  onMoveDown: (pair: TickerPair) => void
}) {
  return (
    <>
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        disabled={isFirst}
        aria-label={`Переместить ${tickerLabel(pair.from)} \u2192 ${tickerLabel(pair.to)} вверх`}
        onClick={() => onMoveUp(pair)}
      >
        <ChevronUp aria-hidden="true" className="size-3" />
      </button>
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        disabled={isLast}
        aria-label={`Переместить ${tickerLabel(pair.from)} \u2192 ${tickerLabel(pair.to)} вниз`}
        onClick={() => onMoveDown(pair)}
      >
        <ChevronDown aria-hidden="true" className="size-3" />
      </button>
    </>
  )
}

/* ── FavoriteRow ──────────────────────────────────────────────── */

function FavoriteRow({
  pair,
  rate,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  pair: TickerPair
  rate: number | undefined
  isFirst: boolean
  isLast: boolean
  onRemove: (pair: TickerPair) => void
  onMoveUp: (pair: TickerPair) => void
  onMoveDown: (pair: TickerPair) => void
}) {
  return (
    <TableRow key={pairId(pair.from, pair.to)}>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <SourceIconWithTooltip source={pair.from.source} />
          <TickerName ticker={pair.from} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <FormatRate
          rate={rate}
          unit={pair.to.unit}
          ticker={pair.to.ticker}
          toName={pair.to.name}
          toSource={pair.to.source}
        />
      </TableCell>
      <TableCell>
        {/* Мобильные: одна кнопка-меню */}
        <div className="md:hidden">
          <FavoriteRowActionsDropdown
            pair={pair}
            isFirst={isFirst}
            isLast={isLast}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        </div>
        {/* Десктоп: инлайн-кнопки */}
        <div className="hidden md:flex items-center gap-0.5">
          <ReorderButtons pair={pair} isFirst={isFirst} isLast={isLast} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
          <div className="mx-0.5 h-5 w-px bg-border" />
          <ConfirmRemoveButton pair={pair} onRemove={onRemove} />
        </div>
      </TableCell>
    </TableRow>
  )
}

/* ── Exported table component ─────────────────────────────────── */

type FavoritesTableProps = {
  favorites: TickerPair[]
  rates: Record<string, number>
  onRemove: (pair: TickerPair) => void
  onMoveUp: (pair: TickerPair) => void
  onMoveDown: (pair: TickerPair) => void
}

export function FavoritesTable({ favorites, rates, onRemove, onMoveUp, onMoveDown }: FavoritesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Валюта</TableHead>
          <TableHead className="text-right">Курс</TableHead>
          <TableHead className="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {favorites.map((pair, index) => (
          <FavoriteRow
            key={pairId(pair.from, pair.to)}
            pair={pair}
            rate={rates[pairId(pair.from, pair.to)]}
            isFirst={index === 0}
            isLast={index === favorites.length - 1}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        ))}
      </TableBody>
    </Table>
  )
}

export { pairId, tickerLabel }
