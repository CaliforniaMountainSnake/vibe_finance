'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatRate, isCrossRate, pairSourceLabel } from '@/lib/utils'
import { ConfirmRemoveButton } from './confirm-remove-button'
import { AddFavoritesDropdown } from './add-favorites-dropdown'
import { dbRepo } from '@/lib/db'
import { ChevronUp, ChevronDown } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
}

/* ── FavoriteRow helpers ─────────────────────────────────────── */

function TickerName({ ticker }: { ticker: Ticker }) {
  return (
    <div className="leading-tight">
      <div className="font-medium text-sm uppercase">{ticker.ticker}</div>
      <div className="text-[10px] text-muted-foreground">{ticker.source}</div>
      {ticker.name && <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{ticker.name}</div>}
    </div>
  )
}

function FormatRate({ pair, rate }: { pair: TickerPair; rate: number | undefined }) {
  const displayRate = rate !== undefined && !isNaN(rate) ? formatRate(rate) : '—'
  return (
    <div>
      <span className="text-sm tabular-nums">{displayRate}</span>
      {isCrossRate(pair) && <div className="text-[10px] text-muted-foreground">{pairSourceLabel(pair)}</div>}
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
  const onlyOne = isFirst && isLast

  return (
    <TableRow key={pairId(pair.from, pair.to)}>
      <TableCell>
        <TickerName ticker={pair.from} />
      </TableCell>
      <TableCell>
        <TickerName ticker={pair.to} />
      </TableCell>
      <TableCell className="text-right">
        <FormatRate pair={pair} rate={rate} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-0.5">
          <ReorderButtons pair={pair} isFirst={isFirst} isLast={isLast} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
          {!onlyOne && <div className="mx-0.5 h-5 w-px bg-border" />}
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
        <CardDescription>Быстрый доступ к важным валютным парам</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет избранных курсов. Добавьте пару кнопкой ниже.
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
      <CardFooter>
        <AddFavoritesDropdown allRates={allRates} onAdded={loadFavorites} />
      </CardFooter>
    </Card>
  )
}
