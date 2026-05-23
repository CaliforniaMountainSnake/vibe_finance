'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DexieRepository } from '@/repositories/DexieRepository'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { formatRate, isCrossRate, pairSourceLabel } from '@/lib/utils'
import { TickerPicker, isTickerEqual } from './ticker-picker'
import { Plus, X } from 'lucide-react'

const dbRepo = new DexieRepository()

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

function pairId(from: Ticker, to: Ticker): string {
  return `${from.source}:${from.ticker}->${to.source}:${to.ticker}`
}

/* ── ConfirmRemoveButton ──────────────────────────────────────── */

function ConfirmRemoveButton({ pair, onRemove }: { pair: TickerPair; onRemove: (pair: TickerPair) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(true)}
        aria-label={`Удалить пару ${tickerLabel(pair.from)} → ${tickerLabel(pair.to)}`}
      >
        <X />
      </Button>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить курс?</AlertDialogTitle>
          <AlertDialogDescription>
            {tickerLabel(pair.from)} → {tickerLabel(pair.to)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onRemove(pair)}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── FavoriteRow ──────────────────────────────────────────────── */

function TickerName({ ticker }: { ticker: Ticker }) {
  return (
    <div className="leading-tight">
      <div className="font-medium text-sm uppercase">{ticker.ticker}</div>
      <div className="text-[10px] text-muted-foreground">{ticker.source}</div>
      {ticker.name && <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{ticker.name}</div>}
    </div>
  )
}

function FavoriteRow({
  pair,
  rate,
  onRemove,
}: {
  pair: TickerPair
  rate: number | undefined
  onRemove: (pair: TickerPair) => void
}) {
  const displayRate = rate !== undefined && !isNaN(rate) ? formatRate(rate) : '—'

  return (
    <TableRow key={pairId(pair.from, pair.to)}>
      <TableCell>
        <TickerName ticker={pair.from} />
      </TableCell>
      <TableCell>
        <TickerName ticker={pair.to} />
      </TableCell>
      <TableCell className="text-right">
        <div>
          <span className="text-sm tabular-nums">{displayRate}</span>
          {isCrossRate(pair) && <div className="text-[10px] text-muted-foreground">{pairSourceLabel(pair)}</div>}
        </div>
      </TableCell>
      <TableCell>
        <ConfirmRemoveButton pair={pair} onRemove={onRemove} />
      </TableCell>
    </TableRow>
  )
}

/* ── FavoritesTable ───────────────────────────────────────────── */

type FavoritesTableProps = {
  favorites: TickerPair[]
  rates: Record<string, number>
  onRemove: (pair: TickerPair) => void
}

function FavoritesTable({ favorites, rates, onRemove }: FavoritesTableProps) {
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
        {favorites.map((pair) => (
          <FavoriteRow
            key={pairId(pair.from, pair.to)}
            pair={pair}
            rate={rates[pairId(pair.from, pair.to)]}
            onRemove={onRemove}
          />
        ))}
      </TableBody>
    </Table>
  )
}

/* ── AddFavoritesDropdown ────────────────────────────────────── */

type AddFavoritesDropdownProps = {
  allRates: ExchangeRate[]
  onAdded: () => void
}

function AddFavoritesDropdown({ allRates, onAdded }: AddFavoritesDropdownProps) {
  const [selectedFrom, setSelectedFrom] = useState<Ticker | null>(null)
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (open) {
      timer = setTimeout(() => inputRef.current?.focus(), 0)
    }
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [open])

  const handleSelect = useCallback(
    async (ticker: Ticker) => {
      if (!selectedFrom) {
        setSelectedFrom(ticker)
        setSearchQuery('')
        inputRef.current?.focus()
        return
      }
      if (isTickerEqual(ticker, selectedFrom)) {
        setSelectedFrom(null)
        return
      }
      await dbRepo.addFavoriteRate({ from: selectedFrom, to: ticker })
      setSelectedFrom(null)
      setOpen(false)
      onAdded()
    },
    [selectedFrom, onAdded]
  )

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedFrom(null)
      setSearchQuery('')
    }
  }, [])

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus />
          Добавить курс
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] p-0" sideOffset={8}>
        <TickerPicker
          allRates={allRates}
          selectedFrom={selectedFrom}
          onSelect={(t) => void handleSelect(t)}
          inputRef={inputRef}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── FavoriteRatesCard ────────────────────────────────────────── */

export function FavoriteRatesCard() {
  const [favorites, setFavorites] = useState<TickerPair[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [rates, setRates] = useState<Record<string, number>>({})

  const loadFavorites = useCallback(async () => {
    const fav = await dbRepo.getFavoriteRates()
    // Репозиторий возвращает новые сверху — переворачиваем, чтобы старые были вверху
    setFavorites(fav.reverse())
  }, [])

  useEffect(() => {
    void (async () => {
      const [fav, all] = await Promise.all([dbRepo.getFavoriteRates(), dbRepo.getAllRates()])
      setFavorites(fav.reverse())
      setAllRates(all)
    })()
  }, [])

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
    setFavorites(fav.reverse())
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
          <FavoritesTable favorites={favorites} rates={rates} onRemove={handleRemove} />
        )}
      </CardContent>
      <CardFooter>
        <AddFavoritesDropdown allRates={allRates} onAdded={loadFavorites} />
      </CardFooter>
    </Card>
  )
}
