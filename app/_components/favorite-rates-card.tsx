'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatAmount } from '@/lib/format-rate'
import { ConfirmRemoveButton } from './confirm-remove-button'
import { AddFavoritesDialog } from './add-favorites-dropdown'
import { FavoriteRowActionsDropdown } from './favorite-row-actions-dropdown'
import { CurrencySearchProvider } from './currency-search-provider'
import { dbRepo } from '@/lib/db'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
}

/* ── FavoriteRow helpers ─────────────────────────────────────── */

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

import { sourceDisplayName } from '@/lib/source-display-name'

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
  const displayRate = rate !== undefined && !isNaN(rate) ? formatAmount(rate) : '—'
  const suffix = unit ?? ticker.toUpperCase()
  const suffixNode = <span className="text-muted-foreground text-sm">{suffix}</span>
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-sm tabular-nums">{displayRate}</span>
      {toName !== undefined ? (
        <Tooltip>
          <TooltipTrigger asChild>{suffixNode}</TooltipTrigger>
          <TooltipContent side="top">{toName}</TooltipContent>
        </Tooltip>
      ) : (
        suffixNode
      )}
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
        aria-label={`Переместить ${tickerLabel(pair.from)} → ${tickerLabel(pair.to)} вверх`}
        onClick={() => onMoveUp(pair)}
      >
        <ChevronUp aria-hidden="true" className="size-3" />
      </button>
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        disabled={isLast}
        aria-label={`Переместить ${tickerLabel(pair.from)} → ${tickerLabel(pair.to)} вниз`}
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

/* ── FavoritesTable ───────────────────────────────────────────── */

type FavoritesTableProps = {
  favorites: TickerPair[]
  rates: Record<string, number>
  onRemove: (pair: TickerPair) => void
  onMoveUp: (pair: TickerPair) => void
  onMoveDown: (pair: TickerPair) => void
}

function FavoritesTable({ favorites, rates, onRemove, onMoveUp, onMoveDown }: FavoritesTableProps) {
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

/* ── FavoriteRatesCard ────────────────────────────────────────── */

type FavoriteRatesCardProps = {
  refreshKey?: number
}

export function FavoriteRatesCard({ refreshKey }: FavoriteRatesCardProps) {
  const [favorites, setFavorites] = useState<TickerPair[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [rates, setRates] = useState<Record<string, number>>({})

  const loadFavorites = useCallback(async () => {
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  useEffect(() => {
    void (async () => {
      const [fav, all] = await Promise.all([dbRepo.getFavoriteRates(), dbRepo.getAllRates()])
      setFavorites(fav)
      setAllRates(all)
    })()
  }, [refreshKey])

  useEffect(() => {
    const compute = async () => {
      const map: Record<string, number> = {}
      for (const pair of favorites) {
        const id = pairId(pair.from, pair.to)
        try {
          map[id] = await dbRepo.getRate(pair)
        } catch {
          /* rate unavailable */
        }
      }
      setRates(map)
    }
    void compute()
  }, [favorites])

  const handleRemove = useCallback(async (pair: TickerPair) => {
    await dbRepo.removeFavoriteRate(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  const handleMoveUp = useCallback(async (pair: TickerPair) => {
    await dbRepo.moveFavoriteRateUp(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  const handleMoveDown = useCallback(async (pair: TickerPair) => {
    await dbRepo.moveFavoriteRateDown(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Избранные курсы</CardTitle>
        <CardAction>
          <CurrencySearchProvider allRates={allRates}>
            <AddFavoritesDialog allRates={allRates} onAdded={loadFavorites} />
          </CurrencySearchProvider>
        </CardAction>
      </CardHeader>
      <CardFooter className="block p-0">
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет избранных курсов. Добавьте пару кнопкой справа вверху.
          </p>
        ) : (
          <FavoritesTable
            favorites={favorites}
            rates={rates}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )}
      </CardFooter>
    </Card>
  )
}
