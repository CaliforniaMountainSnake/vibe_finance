'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatRate } from '@/lib/utils'
import { ConfirmRemoveButton } from './confirm-remove-button'
import { AddFavoritesDialog } from './add-favorites-dropdown'
import { FavoriteRowActionsDropdown } from './favorite-row-actions-dropdown'
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
  return <span className="font-medium text-sm uppercase">{ticker.ticker}</span>
}

function sourceDisplayName(s: SourceName): string {
  return s === 'binance' ? 'Binance' : 'CoinGecko'
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

function SourceIcons({ from, to }: { from: Ticker; to: Ticker }) {
  if (from.source === to.source) {
    return (
      <div className="flex items-center gap-1">
        <SourceIconWithTooltip source={from.source} />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <SourceIconWithTooltip source={from.source} />
      <SourceIconWithTooltip source={to.source} />
    </div>
  )
}

function FormatRate({ rate, unit }: { rate: number | undefined; unit: string | undefined }) {
  const displayRate = rate !== undefined && !isNaN(rate) ? formatRate(rate) : '—'
  return (
    <div>
      <span className="text-sm tabular-nums">{displayRate}</span>
      {unit !== undefined && <span className="text-muted-foreground ml-1 text-sm">{unit}</span>}
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
        <TickerName ticker={pair.from} />
      </TableCell>
      <TableCell>
        <TickerName ticker={pair.to} />
      </TableCell>
      <TableCell className="text-right">
        <FormatRate rate={rate} unit={pair.to.unit} />
      </TableCell>
      <TableCell className="w-px whitespace-nowrap">
        <SourceIcons from={pair.from} to={pair.to} />
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
          <TableHead>Из</TableHead>
          <TableHead>В</TableHead>
          <TableHead className="text-right">Курс</TableHead>
          <TableHead className="w-px" />
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
    await dbRepo.moveFavoriteUp(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  const handleMoveDown = useCallback(async (pair: TickerPair) => {
    await dbRepo.moveFavoriteDown(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Избранные курсы</CardTitle>
        <CardAction>
          <AddFavoritesDialog allRates={allRates} onAdded={loadFavorites} />
        </CardAction>
      </CardHeader>
      <CardContent className="pb-0">
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
      </CardContent>
    </Card>
  )
}
