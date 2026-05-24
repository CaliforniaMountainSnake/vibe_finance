'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Ticker } from '@/entities/Ticker'
import { TickerPicker, isTickerEqual } from './ticker-picker'
import { dbRepo } from '@/lib/db'
import { Plus } from 'lucide-react'

type AddFavoritesDropdownProps = {
  allRates: ExchangeRate[]
  onAdded: () => void
}

export function AddFavoritesDropdown({ allRates, onAdded }: AddFavoritesDropdownProps) {
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
