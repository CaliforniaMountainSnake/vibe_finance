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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HoldingForm } from './holding-form'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Ticker } from '@/entities/ticker'
import { databaseRepo } from '@/lib/database'
import { Plus, X } from 'lucide-react'

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
  selectedTicker: Ticker | undefined
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

type AddHoldingDialogProperties = {
  allRates: ExchangeRate[]
  onAdded: () => void
}

export function AddHoldingDialog({ allRates, onAdded }: AddHoldingDialogProperties) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [selectedTicker, setSelectedTicker] = useState<Ticker>()
  const inputReference = useRef<HTMLInputElement>(null)
  const labelReference = useRef<HTMLTextAreaElement>(null)

  const handleTickerSelect = useCallback((ticker: Ticker) => {
    setSelectedTicker(ticker)
    setTimeout(() => labelReference.current?.focus(), 0)
  }, [])

  const reset = useCallback(() => {
    setAmount('')
    setLabel('')
    setSelectedTicker(undefined)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (open) {
      timer = setTimeout(() => inputReference.current?.focus(), 0)
    }
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [open])

  const handleAdd = useCallback(async () => {
    const parsed = Number.parseFloat(amount.replace(',', '.'))
    if (Number.isNaN(parsed) || !selectedTicker) return
    await databaseRepo.addHolding(selectedTicker, parsed, label.trim())
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

  const canAdd =
    selectedTicker !== undefined && amount.trim() !== '' && !Number.isNaN(Number.parseFloat(amount.replace(',', '.')))

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
          inputRef={inputReference}
          labelRef={labelReference}
          allRates={allRates}
          canAdd={canAdd}
          onAdd={handleAdd}
        />
      </DialogContent>
    </Dialog>
  )
}
