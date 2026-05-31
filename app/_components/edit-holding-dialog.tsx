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
} from '@/components/ui/dialog'
import { HoldingForm } from './holding-form'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'
import { databaseRepo } from '@/lib/database'
import { X } from 'lucide-react'

/* ── EditHoldingDialogContent ──────────── */

function EditHoldingDialogContent({
  amount,
  onAmountChange,
  label,
  onLabelChange,
  selectedTicker,
  onTickerSelect,
  inputReference,
  labelReference,
  allRates,
  canSave,
  onSave,
}: {
  amount: string
  onAmountChange: (v: string) => void
  label: string
  onLabelChange: (v: string) => void
  selectedTicker: Ticker | undefined
  onTickerSelect: (t: Ticker) => void
  inputReference: React.RefObject<HTMLInputElement | null>
  labelReference: React.RefObject<HTMLTextAreaElement | null>
  allRates: ExchangeRate[]
  canSave: boolean
  onSave: () => void
}) {
  return (
    <>
      <DialogClose className="absolute top-3 right-3 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="size-4" />
        <span className="sr-only">Закрыть</span>
      </DialogClose>
      <DialogHeader className="sr-only">
        <DialogTitle>Редактировать сумму</DialogTitle>
        <DialogDescription>Измените сумму, валюту или название</DialogDescription>
      </DialogHeader>
      <div className="p-4">
        <h2 className="font-heading text-base leading-snug font-medium mb-3">Редактировать сумму</h2>
        <HoldingForm
          amount={amount}
          onAmountChange={onAmountChange}
          label={label}
          onLabelChange={onLabelChange}
          allRates={allRates}
          selectedTicker={selectedTicker}
          onTickerSelect={onTickerSelect}
          inputRef={inputReference}
          labelRef={labelReference}
        />
        <Button onClick={onSave} disabled={!canSave} className="w-full mt-3">
          Сохранить
        </Button>
      </div>
    </>
  )
}

/* ── EditHoldingDialog ─────────────────── */

type EditHoldingDialogProperties = {
  holding: Holding
  allRates: ExchangeRate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function EditHoldingDialog({ holding, allRates, open, onOpenChange, onSaved }: EditHoldingDialogProperties) {
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

  // Заполняем поля из пропсов при каждом открытии диалога родителем.
  // Диалог вызывает onOpenChange только при закрытии, поэтому используем effect на проп open.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setAmount(holding.amount.toString())
      setLabel(holding.label)
      setSelectedTicker(holding.ticker)
      setTimeout(() => inputReference.current?.focus(), 0)
    }
  }, [open, holding])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) reset()
      onOpenChange(newOpen)
    },
    [reset, onOpenChange]
  )

  const handleSave = useCallback(async () => {
    const parsed = Number.parseFloat(amount.replace(',', '.'))
    if (Number.isNaN(parsed) || !selectedTicker) return
    await databaseRepo.updateHolding(holding.id, {
      ticker: selectedTicker,
      amount: parsed,
      label: label.trim(),
    })
    reset()
    onOpenChange(false)
    onSaved()
  }, [amount, selectedTicker, label, holding.id, reset, onOpenChange, onSaved])

  const canSave =
    selectedTicker !== undefined && amount.trim() !== '' && !Number.isNaN(Number.parseFloat(amount.replace(',', '.')))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-0 flex flex-col">
        <EditHoldingDialogContent
          amount={amount}
          onAmountChange={setAmount}
          label={label}
          onLabelChange={setLabel}
          selectedTicker={selectedTicker}
          onTickerSelect={handleTickerSelect}
          inputReference={inputReference}
          labelReference={labelReference}
          allRates={allRates}
          canSave={canSave}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  )
}
