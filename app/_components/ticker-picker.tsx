'use client'

import { useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import { Search } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

export function isTickerEqual(a: Ticker, b: Ticker): boolean {
  return a.source === b.source && a.ticker === b.ticker
}

const SOURCE_LABELS: Record<string, string> = { binance: 'Binance', coingecko: 'CoinGecko' }

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
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
    >
      <span className="font-medium uppercase text-xs w-10 shrink-0">{rate.ticker}</span>
      {rate.name && <span className="text-xs text-muted-foreground truncate">{rate.name}</span>}
      <span className="ml-auto text-[10px] text-muted-foreground">{SOURCE_LABELS[rate.source] ?? rate.source}</span>
    </button>
  )
}

/* ── TickerPickerSearch ───────────────────────────────────────── */

function TickerPickerSearch({
  selectedFrom,
  value,
  onChange,
  inputRef,
}: {
  selectedFrom: Ticker | null
  value: string
  onChange: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={selectedFrom ? `Вторая валюта для ${tickerLabel(selectedFrom)} → …` : 'Поиск валюты…'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-7 h-7 text-sm"
        />
      </div>
      {selectedFrom && (
        <p className="mt-1.5 text-[11px] text-muted-foreground px-1">
          Выбрано: <span className="font-medium text-foreground">{tickerLabel(selectedFrom)}</span>
          {' — нажмите на вторую валюту для создания пары'}
        </p>
      )}
    </div>
  )
}

/* ── TickerPicker ─────────────────────────────────────────────── */

type TickerPickerProps = {
  allRates: ExchangeRate[]
  selectedFrom: Ticker | null
  onSelect: (ticker: Ticker) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function TickerPicker({ allRates, selectedFrom, onSelect, inputRef }: TickerPickerProps) {
  const fallbackRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? fallbackRef
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allRates
    return allRates.filter((r) => r.ticker.toLowerCase().includes(q) || (r.name && r.name.toLowerCase().includes(q)))
  }, [allRates, searchQuery])

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
      <TickerPickerSearch selectedFrom={selectedFrom} value={searchQuery} onChange={setSearchQuery} inputRef={ref} />
      <DropdownMenuSeparator />
      {filtered.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">Ничего не найдено</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([source, ratesList]) => (
            <div key={source}>
              <DropdownMenuLabel>{SOURCE_LABELS[source] ?? source}</DropdownMenuLabel>
              {ratesList.map((rate) => (
                <TickerPickerItem
                  key={`${rate.source}:${rate.ticker}`}
                  rate={rate}
                  isSelected={selectedFrom !== null && isTickerEqual(rate, selectedFrom)}
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
