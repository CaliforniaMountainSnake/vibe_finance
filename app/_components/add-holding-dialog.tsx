'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TickerPicker } from './ticker-picker'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import { dbRepo } from '@/lib/db'
import { Plus, X, ChevronDown } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return t.name ?? t.ticker.toUpperCase()
}

/* ── TickerSelect── */

function TickerSelect({
  allRates,
  selectedTicker,
  onSelect,
}: {
  allRates: ExchangeRate[]
  selectedTicker: Ticker | null
  onSelect: (ticker: Ticker) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pickerInputRef = useRef<HTMLInputElement>(null)

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
    setTimeout(() => pickerInputRef.current?.focus(), 0)
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
        inputRef={pickerInputRef}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Поиск валюты…"
      />
    </div>
  )
}

/* ── HoldingForm ──────────────────────── */

type HoldingFormProps = {
  amount: string
  onAmountChange: (v: string) => void
  label: string
  onLabelChange: (v: string) => void
  labelRef: React.RefObject<HTMLTextAreaElement | null>
  allRates: ExchangeRate[]
  selectedTicker: Ticker | null
  onTickerSelect: (t: Ticker) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

function HoldingForm({
  amount,
  onAmountChange,
  label,
  onLabelChange,
  labelRef,
  allRates,
  selectedTicker,
  onTickerSelect,
  inputRef,
}: HoldingFormProps) {
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
          onChange={(e) => onAmountChange(e.target.value)}
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
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Название счёта…"
          rows={2}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none md:text-sm dark:bg-input/30"
        />
      </div>
    </div>
  )
}

/* ── AddHoldingDialogContent ───────────── */

function AddHoldingDialogContent({
  amount,
  onAmountChange,
  label,
  onLabelChange,
  selectedTicker,
  onTickerSelect,
  inputRef,
  labelRef,
  allRates,
  canAdd,
  onAdd,
}: {
  amount: string
  onAmountChange: (v: string) => void
  label: string
  onLabelChange: (v: string) => void
  selectedTicker: Ticker | null
  onTickerSelect: (t: Ticker) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  labelRef: React.RefObject<HTMLTextAreaElement | null>
  allRates: ExchangeRate[]
  canAdd: boolean
  onAdd: () => void
}) {
  return (
    <>
      <DialogClose className="absolute top-3 right-3 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="size-4" />
        <span className="sr-only">Закрыть</span>
      </DialogClose>
      <DialogHeader className="sr-only">
        <DialogTitle>Добавить сумму</DialogTitle>
        <DialogDescription>Введите сумму, выберите валюту и добавьте название</DialogDescription>
      </DialogHeader>
      <div className="p-4">
        <h2 className="font-heading text-base leading-snug font-medium mb-3">Добавить сумму</h2>
        <HoldingForm
          amount={amount}
          onAmountChange={onAmountChange}
          label={label}
          onLabelChange={onLabelChange}
          allRates={allRates}
          selectedTicker={selectedTicker}
          onTickerSelect={onTickerSelect}
          inputRef={inputRef}
          labelRef={labelRef}
        />
        <Button onClick={onAdd} disabled={!canAdd} className="w-full mt-3">
          Добавить
        </Button>
      </div>
    </>
  )
}

/* ── AddHoldingDialog ─────────────────── */

type AddHoldingDialogProps = {
  allRates: ExchangeRate[]
  onAdded: () => void
}

export function AddHoldingDialog({ allRates, onAdded }: AddHoldingDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const labelRef = useRef<HTMLTextAreaElement>(null)

  const handleTickerSelect = useCallback((ticker: Ticker) => {
    setSelectedTicker(ticker)
    setTimeout(() => labelRef.current?.focus(), 0)
  }, [])

  const reset = useCallback(() => {
    setAmount('')
    setLabel('')
    setSelectedTicker(null)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (open) {
      timer = setTimeout(() => inputRef.current?.focus(), 0)
    }
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [open])

  const handleAdd = useCallback(async () => {
    const parsed = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsed) || !selectedTicker) return
    await dbRepo.addHolding(selectedTicker, parsed, label.trim())
    reset()
    setOpen(false)
    onAdded()
  }, [amount, selectedTicker, label, reset, onAdded])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) reset()
      setOpen(newOpen)
    },
    [reset]
  )

  const canAdd = selectedTicker !== null && amount.trim() !== '' && !isNaN(parseFloat(amount.replace(',', '.')))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Добавить сумму">
              <Plus />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Добавить сумму</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-sm p-0 flex flex-col">
        <AddHoldingDialogContent
          amount={amount}
          onAmountChange={setAmount}
          label={label}
          onLabelChange={setLabel}
          selectedTicker={selectedTicker}
          onTickerSelect={handleTickerSelect}
          inputRef={inputRef}
          labelRef={labelRef}
          allRates={allRates}
          canAdd={canAdd}
          onAdd={handleAdd}
        />
      </DialogContent>
    </Dialog>
  )
}
