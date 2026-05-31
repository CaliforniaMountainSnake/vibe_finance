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
import { TickerPicker } from './ticker-picker'
import { databaseRepo } from '@/lib/database'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Ticker } from '@/entities/ticker'
import { Calculator, X } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'

function DialogCloseButton() {
  return (
    <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <X className="size-4" />
      <span className="sr-only">Закрыть</span>
    </DialogClose>
  )
}

type TotalCurrencyPickerProperties = {
  allRates: ExchangeRate[]
  value: Ticker | undefined
  onChange: (ticker: Ticker | undefined) => void
}

export function TotalCurrencyPicker({ allRates, value, onChange }: TotalCurrencyPickerProperties) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputReference = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (open) {
      timer = setTimeout(() => inputReference.current?.focus(), 0)
    }
    return () => {
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [open])

  const handleSelect = useCallback(
    async (ticker: Ticker) => {
      await databaseRepo.setSetting('totalBaseTicker', ticker)
      onChange(ticker)
      setOpen(false)
      setSearchQuery('')
    },
    [onChange]
  )

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) setSearchQuery('')
  }, [])

  const label = value ? `${value.ticker.toUpperCase()}` : '?'
  const showIcon = value !== undefined

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              {showIcon ? (
                <SourceIcon source={value.source} className="size-3.5" />
              ) : (
                <Calculator className="size-3.5" />
              )}
              {label}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Выбрать валюту для подсчёта итога</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-sm h-[70vh] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Выбрать валюту для итога</DialogTitle>
          <DialogDescription>Выберите валюту, в которой будет отображаться общая сумма портфеля</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col min-h-0 flex-1">
          <TickerPicker
            allRates={allRates}
            selected={value}
            onSelect={handleSelect}
            inputRef={inputReference}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Валюта для подсчёта итога…"
            searchRightElement={<DialogCloseButton />}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
