'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { EditHoldingDialog } from './edit-holding-dialog'
import { HoldingRemoveDialog, HoldingMobileActions, HoldingDesktopActions } from './holding-row-actions'
import { formatAmount } from '@/lib/format-amount'
import { SourceIcon } from '@/components/icons/source-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { sourceDisplayName } from '@/lib/source-display-name'

function tickerLabel(t: Ticker): string {
  return t.ticker.toUpperCase()
}

/* ── AmountCellLabel ───────────────────── */

function AmountCellLabel({ displayLabel, hasLabel }: { displayLabel: string | undefined; hasLabel: boolean }) {
  if (!displayLabel) return null
  return (
    <div
      className={`text-sm tabular-nums leading-tight mt-0.5 pl-[1.375rem]${hasLabel ? '' : ' text-muted-foreground'}`}
    >
      {displayLabel}
    </div>
  )
}

/* ── AmountCell ────────────────────────── */

function AmountCell({
  holding,
  convertedAmount,
  totalLabel,
  rateTooltip,
  displayLabel,
  showConverted,
  hasLabel,
}: {
  holding: Holding
  convertedAmount: string | undefined
  totalLabel: string | null
  rateTooltip: React.ReactNode
  displayLabel: string | undefined
  showConverted: boolean
  hasLabel: boolean
}) {
  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <div className="flex items-center gap-1.5">
              <SourceIcon source={holding.ticker.source} className="size-3 shrink-0 text-muted-foreground" />
              <span className="text-sm tabular-nums font-medium">{formatAmount(holding.amount)}</span>
              <span className="text-muted-foreground text-sm tabular-nums">{unitOrTicker}</span>
            </div>
            {showConverted && (
              <div className="text-sm tabular-nums leading-tight pl-[1.375rem]">
                ≈ {convertedAmount} <span className="text-muted-foreground">{totalLabel}</span>
              </div>
            )}
            <AmountCellLabel displayLabel={displayLabel} hasLabel={hasLabel} />
          </span>
        </TooltipTrigger>
        {rateTooltip}
      </Tooltip>
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

function holdingUnit(t: Ticker): string {
  return t.unit ?? t.ticker.toUpperCase()
}

function isSameCurrency(ticker: Ticker, totalTicker: Ticker | null): boolean {
  return totalTicker !== null && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}

function holdingDisplayInfo(
  holding: Holding,
  totalTicker: Ticker | null
): { totalLabel: string | null; sameCurrency: boolean; displayLabel: string | undefined; hasLabel: boolean } {
  const totalLabel = totalTicker ? totalTicker.ticker.toUpperCase() : null
  const sameCurrency = isSameCurrency(holding.ticker, totalTicker)
  const displayLabel = holding.label || holding.ticker.name
  const hasLabel = holding.label !== ''
  return { totalLabel, sameCurrency, displayLabel, hasLabel }
}

function HoldingTooltipRateOrFallback({
  unit,
  conversionRate,
  totalUnit,
  same,
}: {
  unit: string
  conversionRate: number | undefined
  totalUnit: string
  same: boolean
}) {
  if (same) return null
  if (conversionRate === undefined || isNaN(conversionRate)) {
    return <span className="text-muted-foreground">Курс недоступен</span>
  }
  return (
    <span className="tabular-nums">
      1 {unit} ≈ {formatAmount(conversionRate)} {totalUnit}
    </span>
  )
}

function HoldingTooltipContent({
  holding,
  unit,
  conversionRate,
  totalUnit,
  same,
}: {
  holding: Holding
  unit: string
  conversionRate: number | undefined
  totalUnit: string
  same: boolean
}) {
  return (
    <TooltipContent side="top" className="flex flex-col items-start">
      <span>{sourceDisplayName(holding.ticker.source)}</span>
      {holding.ticker.name && <span className="font-medium">{holding.ticker.name}</span>}
      <HoldingTooltipRateOrFallback unit={unit} conversionRate={conversionRate} totalUnit={totalUnit} same={same} />
    </TooltipContent>
  )
}

function HoldingTooltip({
  holding,
  conversionRate,
  totalTicker,
}: {
  holding: Holding
  conversionRate: number | undefined
  totalTicker: Ticker | null
}) {
  const unit = holdingUnit(holding.ticker)
  const totalUnit = totalTicker ? holdingUnit(totalTicker) : ''
  const same = isSameCurrency(holding.ticker, totalTicker)

  return (
    <HoldingTooltipContent
      holding={holding}
      unit={unit}
      conversionRate={conversionRate}
      totalUnit={totalUnit}
      same={same}
    />
  )
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
  const { totalLabel, sameCurrency, displayLabel, hasLabel } = holdingDisplayInfo(holding, totalTicker)
  const showConverted = !sameCurrency && converted !== undefined && totalLabel !== null

  return (
    <>
      <TableRow className={disabled ? 'opacity-40 hover:opacity-60' : ''}>
        <AmountCell
          holding={holding}
          convertedAmount={converted}
          totalLabel={totalLabel}
          rateTooltip={<HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />}
          displayLabel={displayLabel}
          showConverted={showConverted}
          hasLabel={hasLabel}
        />
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
