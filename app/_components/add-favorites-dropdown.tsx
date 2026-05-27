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
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import { TickerPicker } from './ticker-picker'
import { dbRepo } from '@/lib/db'
import { Plus, X } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

function isTickerEqual(a: Ticker, b: Ticker): boolean {
  return a.source === b.source && a.ticker === b.ticker
}

function DialogCloseButton() {
  return (
    <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
      <X className="size-4" />
      <span className="sr-only">Закрыть</span>
    </DialogClose>
  )
}

type AddFavoritesDialogProps = {
  allRates: ExchangeRate[]
  onAdded: () => void
}

export function AddFavoritesDialog({ allRates, onAdded }: AddFavoritesDialogProps) {
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
    setSelectedFrom(null)
    setSearchQuery('')
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Добавить курс">
              <Plus />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Добавить курс</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-sm h-[70vh] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Добавить курс в избранное</DialogTitle>
          <DialogDescription>Выберите пару валют из доступных курсов</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col min-h-0 flex-1">
          {selectedFrom && (
            <p className="px-3 pt-2 text-[11px] text-muted-foreground">
              Первая валюта: <span className="font-medium text-foreground">{tickerLabel(selectedFrom)}</span>
              {' — выберите вторую валюту'}
            </p>
          )}
          <TickerPicker
            allRates={allRates}
            selected={selectedFrom}
            onSelect={(t) => void handleSelect(t)}
            inputRef={inputRef}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={selectedFrom ? `Вторая валюта для ${tickerLabel(selectedFrom)} → …` : 'Поиск валюты…'}
            searchRightElement={<DialogCloseButton />}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
