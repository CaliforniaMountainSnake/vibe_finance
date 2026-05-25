'use client'

import { useState } from 'react'
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
import { TableCell, TableRow } from '@/components/ui/table'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { formatAmount } from '@/lib/utils'
import { ChevronUp, ChevronDown, EllipsisVertical, X, Eye, EyeOff } from 'lucide-react'
import { SourceIcon } from '@/components/icons/source-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SourceName } from '@/entities/ExchangeRate'

const SOURCE_DISPLAY: Record<string, string> = { binance: 'Binance', coingecko: 'CoinGecko' }

function SourceIconWithTooltip({ source }: { source: SourceName }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <SourceIcon source={source} className="size-3 shrink-0 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{SOURCE_DISPLAY[source] ?? source}</TooltipContent>
    </Tooltip>
  )
}

function tickerLabel(t: Ticker): string {
  return t.ticker.toUpperCase()
}

/* ── AmountCell ────────────────────────── */

function AmountCell({
  holding,
  converted,
  totalLabel,
  showConverted,
}: {
  holding: Holding
  converted: string | undefined
  totalLabel: string | null
  showConverted: boolean
}) {
  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)
  return (
    <TableCell>
      <div className="flex items-center gap-1.5">
        <SourceIconWithTooltip source={holding.ticker.source} />
        <span className="text-sm tabular-nums font-medium">{formatAmount(holding.amount)}</span>
        <span className="text-muted-foreground text-sm">{unitOrTicker}</span>
      </div>
      {showConverted && converted !== undefined && totalLabel !== null && (
        <div className="text-[11px] text-muted-foreground tabular-nums leading-tight pl-[22px]">
          ≈ {converted} {totalLabel}
        </div>
      )}
    </TableCell>
  )
}

/* ── LabelCell ─────────────────────────── */

function LabelCell({ label }: { label: string }) {
  return (
    <TableCell>
      <span className="text-sm">{label || '—'}</span>
    </TableCell>
  )
}

function RemoveDialog({
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

/* ── MobileActions ─────────────────────── */

function MobileActions({
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onRemoveClick,
}: {
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleEnabled: () => void
  onRemoveClick: () => void
}) {
  return (
    <div className="md:hidden">
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

/* ── DesktopActions ────────────────────── */

function DesktopActions({
  isFirst,
  isLast,
  disabled,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onRemoveClick,
}: {
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleEnabled: () => void
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
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
        aria-label="Удалить"
        onClick={onRemoveClick}
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </div>
  )
}

/* ── HoldingRow ────────────────────────── */

type HoldingRowProps = {
  holding: Holding
  isFirst: boolean
  isLast: boolean
  conversionRate: number | undefined
  totalTicker: Ticker | null
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
  onRemove: (id: string) => void
}

function computeConverted(amount: number, rate: number | undefined): string | undefined {
  if (rate === undefined || isNaN(rate)) return undefined
  return formatAmount(amount * rate)
}

export function HoldingRow({
  holding,
  isFirst,
  isLast,
  conversionRate,
  totalTicker,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onRemove,
}: HoldingRowProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const disabled = !holding.enabled

  const converted = computeConverted(holding.amount, conversionRate)
  const totalLabel = totalTicker ? totalTicker.ticker.toUpperCase() : null
  const sameCurrency =
    totalTicker !== null && holding.ticker.source === totalTicker.source && holding.ticker.ticker === totalTicker.ticker

  return (
    <>
      <TableRow className={disabled ? 'opacity-40 hover:opacity-60' : ''}>
        <AmountCell holding={holding} converted={converted} totalLabel={totalLabel} showConverted={!sameCurrency} />
        <LabelCell label={holding.label} />
        <TableCell className="w-px whitespace-nowrap">
          <MobileActions
            isFirst={isFirst}
            isLast={isLast}
            disabled={disabled}
            onMoveUp={() => onMoveUp(holding.id)}
            onMoveDown={() => onMoveDown(holding.id)}
            onToggleEnabled={() => onToggleEnabled(holding.id)}
            onRemoveClick={() => setRemoveOpen(true)}
          />
          <DesktopActions
            isFirst={isFirst}
            isLast={isLast}
            disabled={disabled}
            onMoveUp={() => onMoveUp(holding.id)}
            onMoveDown={() => onMoveDown(holding.id)}
            onToggleEnabled={() => onToggleEnabled(holding.id)}
            onRemoveClick={() => setRemoveOpen(true)}
          />
        </TableCell>
      </TableRow>

      <RemoveDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        onConfirm={() => onRemove(holding.id)}
        holding={holding}
      />
    </>
  )
}
