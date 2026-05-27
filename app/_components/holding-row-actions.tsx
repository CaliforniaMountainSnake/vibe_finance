'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { formatAmount } from '@/lib/format-rate'
import { ChevronUp, ChevronDown, EllipsisVertical, X, Eye, EyeOff, Pencil } from 'lucide-react'

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

/* ── HoldingMobileActions ──────────────── */

export function HoldingMobileActions({
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onEditClick,
  onRemoveClick,
}: {
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleEnabled: () => void
  onEditClick: () => void
  onRemoveClick: () => void
}) {
  return (
    <div className="md:hidden flex items-center gap-0.5">
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Редактировать"
        onClick={onEditClick}
      >
        <Pencil aria-hidden="true" className="size-3" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Действия">
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isFirst} onClick={onMoveUp}>
            <ChevronUp aria-hidden="true" className="size-4" />
            Переместить вверх
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isLast} onClick={onMoveDown}>
            <ChevronDown aria-hidden="true" className="size-4" />
            Переместить вниз
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleEnabled}>
            {disabled ? (
              <>
                <Eye aria-hidden="true" className="size-4" />
                Учитывать в итоге
              </>
            ) : (
              <>
                <EyeOff aria-hidden="true" className="size-4" />
                Не учитывать в итоге
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onRemoveClick}>
            <X aria-hidden="true" className="size-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/* ── HoldingDesktopActions ─────────────── */

export function HoldingDesktopActions({
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onEditClick,
  onRemoveClick,
}: {
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleEnabled: () => void
  onEditClick: () => void
  onRemoveClick: () => void
}) {
  const reorderBtnClasses =
    'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className="hidden md:flex items-center gap-0.5">
      <button
        type="button"
        className={reorderBtnClasses}
        disabled={isFirst}
        aria-label="Переместить вверх"
        onClick={onMoveUp}
      >
        <ChevronUp aria-hidden="true" className="size-3" />
      </button>
      <button
        type="button"
        className={reorderBtnClasses}
        disabled={isLast}
        aria-label="Переместить вниз"
        onClick={onMoveDown}
      >
        <ChevronDown aria-hidden="true" className="size-3" />
      </button>
      <div className="mx-0.5 h-5 w-px bg-border" />
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={disabled ? 'Учитывать в итоге' : 'Не учитывать в итоге'}
        onClick={onToggleEnabled}
      >
        {disabled ? <Eye aria-hidden="true" className="size-3" /> : <EyeOff aria-hidden="true" className="size-3" />}
      </button>
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Редактировать"
        onClick={onEditClick}
      >
        <Pencil aria-hidden="true" className="size-3" />
      </button>
      <div className="mx-0.5 h-5 w-px bg-border" />
      <button
        type="button"
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
        aria-label="Удалить"
        onClick={onRemoveClick}
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </div>
  )
}
