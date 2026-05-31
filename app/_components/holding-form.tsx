'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TickerPicker } from './ticker-picker'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Ticker } from '@/entities/ticker'
import { ChevronDown } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return t.name ?? t.ticker.toUpperCase()
}

/* ── TickerSelect ── */

export function TickerSelect({
  allRates,
  selectedTicker,
  onSelect,
}: {
  allRates: ExchangeRate[]
  selectedTicker: Ticker | undefined
  onSelect: (ticker: Ticker) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pickerInputReference = useRef<HTMLInputElement>(null)

  const handleSelect = useCallback(
    (ticker: Ticker) => {
      onSelect(ticker)
      setOpen(false)
      setSearchQuery('')
    },
    [onSelect]
  )

  const handleOpen = useCallback(() => {
    setOpen(true)
    setTimeout(() => pickerInputReference.current?.focus(), 0)
  }, [])

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={handleOpen} className="w-full h-9 justify-between font-normal">
        {selectedTicker ? (
          <span className="text-sm">{tickerLabel(selectedTicker)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Выберите валюту</span>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div className="border rounded-lg max-h-48 flex flex-col">
      <TickerPicker
        allRates={allRates}
        selected={selectedTicker}
        onSelect={handleSelect}
        inputRef={pickerInputReference}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Поиск валюты…"
      />
    </div>
  )
}

/* ── HoldingForm ── */

type HoldingFormProperties = {
  amount: string
  onAmountChange: (v: string) => void
  label: string
  onLabelChange: (v: string) => void
  labelRef: React.RefObject<HTMLTextAreaElement | null>
  allRates: ExchangeRate[]
  selectedTicker: Ticker | undefined
  onTickerSelect: (t: Ticker) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function HoldingForm({
  amount,
  onAmountChange,
  label,
  onLabelChange,
  labelRef,
  allRates,
  selectedTicker,
  onTickerSelect,
  inputRef,
}: HoldingFormProperties) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Сумма</label>
        <Input
          ref={inputRef}
          type="number"
          step="any"
          placeholder="0"
          value={amount}
          onChange={(event_) => onAmountChange(event_.target.value)}
          className="h-9 text-base"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Валюта</label>
        <TickerSelect allRates={allRates} selectedTicker={selectedTicker} onSelect={onTickerSelect} />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Название</label>
        <textarea
          ref={labelRef}
          value={label}
          onChange={(event_) => onLabelChange(event_.target.value)}
          placeholder="Название счёта…"
          rows={3}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
        />
      </div>
    </div>
  )
}
