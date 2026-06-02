'use client'

import { type ReactNode, useMemo, useRef } from 'react'
import { Input } from '@/components/ui/input'
import type { ExchangeRate, SourceName } from '@/entities/exchange-rate'
import type { Ticker } from '@/entities/ticker'
import { Search, X } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'
import { useCurrencySearch } from '@/app/providers/currency-search-provider'
import { sourceDisplayName } from '@/lib/source-display-name'

function SourceGroupLabel({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SourceIcon source={source as SourceName} className="size-3 text-muted-foreground" />
      <span>{sourceDisplayName(source as SourceName)}</span>
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
      onClick={() => {
        onSelect(ticker)
      }}
      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium uppercase text-xs">
          {rate.ticker}
          {rate.unit && <span className="text-muted-foreground ml-1">{rate.unit}</span>}
        </span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{sourceDisplayName(rate.source)}</span>
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
  rightElement,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputRef: React.RefObject<HTMLInputElement | null>
  rightElement?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 p-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder ?? 'Поиск валюты…'}
          value={value}
          onChange={(event_) => {
            onChange(event_.target.value)
          }}
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
      {rightElement}
    </div>
  )
}

/* ── TickerPicker ─────────────────────────────────────────────── */

type TickerPickerProperties = {
  allRates: ExchangeRate[]
  selected: Ticker | undefined
  onSelect: (ticker: Ticker) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  searchQuery: string
  onSearchChange: (v: string) => void
  /** Кастомный плейсхолдер для поля поиска */
  searchPlaceholder?: string
  /** Элемент справа от строки поиска (например, кнопка закрытия диалога) */
  searchRightElement?: ReactNode
}

export function TickerPicker({
  allRates,
  selected,
  onSelect,
  inputRef,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchRightElement,
}: TickerPickerProperties) {
  const fallbackReference = useRef<HTMLInputElement>(null)
  const reference = inputRef ?? fallbackReference

  const fuse = useCurrencySearch()

  const filtered = useMemo(() => {
    const q = searchQuery.trim()
    if (!q || !fuse) return allRates
    return fuse.search(q).map((r) => r.item)
  }, [fuse, searchQuery, allRates])

  const matchCount = searchQuery.trim() ? filtered.length : allRates.length

  const grouped = useMemo(() => {
    const map: Record<string, ExchangeRate[]> = {}
    for (const rate of filtered) {
      const source = rate.source
      if (Object.hasOwn(map, source)) {
        map[source].push(rate)
      } else {
        map[source] = [rate]
      }
    }
    return map
  }, [filtered])

  return (
    <>
      <TickerPickerSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        inputRef={reference}
        rightElement={searchRightElement}
      />
      {matchCount > 0 && <p className="px-3 pb-0.5 text-xs text-muted-foreground">Найдено {matchCount}</p>}
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
                  isSelected={
                    selected !== undefined && selected.source === rate.source && selected.ticker === rate.ticker
                  }
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
