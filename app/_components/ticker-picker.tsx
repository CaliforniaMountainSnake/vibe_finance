'use client'

import { useMemo, useRef } from 'react'
import Fuse from 'fuse.js'
import { Input } from '@/components/ui/input'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import { Search, X } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'

const SOURCE_LABELS: Record<string, string> = { binance: 'Binance', coingecko: 'CoinGecko', moex: 'MOEX' }

function SourceGroupLabel({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SourceIcon source={source as SourceName} className="size-3 text-muted-foreground" />
      <span>{SOURCE_LABELS[source] ?? source}</span>
    </span>
  )
}

/* ── TickerPickerItem ─────────────────────────────────────────── */

function TickerPickerItem({
  rate,
  isSelected,
  onSelect,
}: {
  rate: ExchangeRate
  isSelected: boolean
  onSelect: (ticker: Ticker) => void
}) {
  const ticker: Ticker = { source: rate.source, ticker: rate.ticker, name: rate.name, unit: rate.unit }
  return (
    <button
      type="button"
      onClick={() => onSelect(ticker)}
      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium uppercase text-xs">{rate.ticker}</span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          {SOURCE_LABELS[rate.source] ?? rate.source}
        </span>
      </div>
      {rate.name && <div className="text-xs text-muted-foreground">{rate.name}</div>}
    </button>
  )
}

/* ── TickerPickerSearch ───────────────────────────────────────── */

function TickerPickerSearch({
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder ?? 'Поиск валюты…'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-7 pr-7 h-7 text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Очистить поиск"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── TickerPicker ─────────────────────────────────────────────── */

type TickerPickerProps = {
  allRates: ExchangeRate[]
  selected: Ticker | null
  onSelect: (ticker: Ticker) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  searchQuery: string
  onSearchChange: (v: string) => void
  /** Кастомный плейсхолдер для поля поиска */
  searchPlaceholder?: string
}

export function TickerPicker({
  allRates,
  selected,
  onSelect,
  inputRef,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: TickerPickerProps) {
  const fallbackRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? fallbackRef

  const fuse = useMemo(
    () =>
      new Fuse(allRates, {
        keys: [
          { name: 'ticker', weight: 0.5 },
          { name: 'name', weight: 0.35 },
          { name: 'source', weight: 0.15 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [allRates]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return allRates
    return fuse.search(q).map((r) => r.item)
  }, [fuse, searchQuery, allRates])

  const grouped = useMemo(() => {
    const map: Record<string, ExchangeRate[]> = {}
    for (const rate of filtered) {
      if (!map[rate.source]) map[rate.source] = []
      map[rate.source].push(rate)
    }
    return map
  }, [filtered])

  return (
    <>
      <TickerPickerSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        inputRef={ref}
      />
      <div className="mx-0 my-1 h-px bg-border shrink-0" />
      {filtered.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">Ничего не найдено</p>
      ) : (
        <div className="overflow-y-auto flex-1">
          {Object.entries(grouped).map(([source, ratesList]) => (
            <div key={source}>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <SourceGroupLabel source={source} />
              </div>
              {ratesList.map((rate) => (
                <TickerPickerItem
                  key={`${rate.source}:${rate.ticker}`}
                  rate={rate}
                  isSelected={selected !== null && selected.source === rate.source && selected.ticker === rate.ticker}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
