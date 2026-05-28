'use client'

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
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { formatAmount } from '@/lib/format-amount'

function tickerLabel(t: Ticker): string {
  return t.ticker.toUpperCase()
}

/* ── RemoveDialog ──────────────────────── */

export function HoldingRemoveDialog({
  open,
  onOpenChange,
  onConfirm,
  holding,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  holding: Holding
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить сумму?</AlertDialogTitle>
          <AlertDialogDescription>
            {holding.label || tickerLabel(holding.ticker)} — {formatAmount(holding.amount)}{' '}
            {tickerLabel(holding.ticker)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
