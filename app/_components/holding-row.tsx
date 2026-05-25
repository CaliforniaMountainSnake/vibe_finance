'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { EditHoldingDialog } from './edit-holding-dialog'
import { HoldingRemoveDialog, HoldingMobileActions, HoldingDesktopActions } from './holding-row-actions'
import { formatAmount } from '@/lib/utils'
import { SourceIcon } from '@/components/icons/source-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SOURCE_DISPLAY: Record<string, string> = { binance: 'Binance', coingecko: 'CoinGecko' }

export function SourceIconWithTooltip({ source }: { source: SourceName }) {
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
      <span className="text-sm whitespace-normal break-words">{label || '—'}</span>
    </TableCell>
  )
}

/* ── HoldingRow ────────────────────────── */

type HoldingRowProps = {
  holding: Holding
  isFirst: boolean
  isLast: boolean
  conversionRate: number | undefined
  totalTicker: Ticker | null
  allRates: ExchangeRate[]
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
  onRemove: (id: string) => void
  onEdited: () => void
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
  allRates,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onRemove,
  onEdited,
}: HoldingRowProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
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
          <HoldingMobileActions
            isFirst={isFirst}
            isLast={isLast}
            disabled={disabled}
            onMoveUp={() => onMoveUp(holding.id)}
            onMoveDown={() => onMoveDown(holding.id)}
            onToggleEnabled={() => onToggleEnabled(holding.id)}
            onEditClick={() => setEditOpen(true)}
            onRemoveClick={() => setRemoveOpen(true)}
          />
          <HoldingDesktopActions
            isFirst={isFirst}
            isLast={isLast}
            disabled={disabled}
            onMoveUp={() => onMoveUp(holding.id)}
            onMoveDown={() => onMoveDown(holding.id)}
            onToggleEnabled={() => onToggleEnabled(holding.id)}
            onEditClick={() => setEditOpen(true)}
            onRemoveClick={() => setRemoveOpen(true)}
          />
        </TableCell>
      </TableRow>

      <HoldingRemoveDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        onConfirm={() => onRemove(holding.id)}
        holding={holding}
      />
      <EditHoldingDialog
        holding={holding}
        allRates={allRates}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onEdited}
      />
    </>
  )
}
