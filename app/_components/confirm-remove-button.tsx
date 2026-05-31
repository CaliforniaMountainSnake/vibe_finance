'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Ticker } from '@/entities/ticker'
import type { TickerPair } from '@/entities/ticker-pair'
import { X } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

export function ConfirmRemoveButton({ pair, onRemove }: { pair: TickerPair; onRemove: (pair: TickerPair) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(true)}
        aria-label={`Удалить пару ${tickerLabel(pair.from)} → ${tickerLabel(pair.to)}`}
      >
        <X />
      </Button>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить курс?</AlertDialogTitle>
          <AlertDialogDescription>
            {tickerLabel(pair.from)} → {tickerLabel(pair.to)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onRemove(pair)}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
