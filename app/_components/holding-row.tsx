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
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip'
import { HoldingTooltip } from './holding-tooltip'

function tickerLabel(t: Ticker): string {
  return t.ticker.toUpperCase()
}

/* ── OriginalColumn ───────────────────── */

function OriginalColumn({ amount, unitOrTicker, holding }: { amount: string; unitOrTicker: string; holding: Holding }) {
  return (
    <div className="flex items-center gap-1.5 text-right whitespace-nowrap">
      <span className="text-sm tabular-nums font-medium">{amount}</span>
      <span className="text-muted-foreground text-sm tabular-nums">{unitOrTicker}</span>
      <SourceIcon source={holding.ticker.source} className="size-3 shrink-0 text-muted-foreground" />
    </div>
  )
}

/* ── LabelRow ──────────────────────────── */

function LabelRow({ displayLabel, hasLabel }: { displayLabel: string; hasLabel: boolean }) {
  return (
    <div className={`col-span-2 text-sm leading-tight${hasLabel ? '' : ' text-muted-foreground'}`}>{displayLabel}</div>
  )
}

/* ── LeftColumn ────────────────────────── */

function LeftColumn({
  same,
  showConverted,
  rateUnavailable,
  convertedAmount,
  totalLabel,
}: {
  same: boolean
  showConverted: boolean
  rateUnavailable: boolean
  convertedAmount: string
  totalLabel: string | null
}) {
  return (
    <div className="text-sm tabular-nums whitespace-nowrap">
      {rateUnavailable && <span className="text-destructive">Курс недоступен</span>}
      {same && totalLabel && (
        <span className="font-medium">
          {convertedAmount} <span className="text-muted-foreground">{totalLabel}</span>
        </span>
      )}
      {showConverted && (
        <>
          <span className="text-muted-foreground">≈</span> <span className="font-medium">{convertedAmount}</span>{' '}
          <span className="text-muted-foreground">{totalLabel}</span>
        </>
      )}
    </div>
  )
}

/* ── AmountCell ────────────────────────── */

function AmountCell({
  holding,
  leftAmount,
  leftLabel,
  rateTooltip,
  displayLabel,
  showConverted,
  rateUnavailable,
  hasLabel,
  same,
}: {
  holding: Holding
  leftAmount: string
  leftLabel: string | null
  rateTooltip: React.ReactNode
  displayLabel: string | undefined
  showConverted: boolean
  rateUnavailable: boolean
  hasLabel: boolean
  same: boolean
}) {
  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)
  return (
    <TableCell className="w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block w-full">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 items-baseline">
              <div className="min-w-0">
                <LeftColumn
                  same={same}
                  showConverted={showConverted}
                  rateUnavailable={rateUnavailable}
                  convertedAmount={leftAmount}
                  totalLabel={leftLabel}
                />
              </div>
              {!same && (
                <OriginalColumn amount={formatAmount(holding.amount)} unitOrTicker={unitOrTicker} holding={holding} />
              )}
              {displayLabel && <LabelRow displayLabel={displayLabel} hasLabel={hasLabel} />}
            </div>
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

function isSameCurrency(ticker: Ticker, totalTicker: Ticker | null): boolean {
  return totalTicker !== null && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}

function holdingDisplayLabel(holding: Holding): {
  displayLabel: string | undefined
  hasLabel: boolean
} {
  const displayLabel = holding.label || holding.ticker.name
  const hasLabel = holding.label !== ''
  return { displayLabel, hasLabel }
}

function holdingConversionFlags(
  totalLabel: string | null,
  same: boolean,
  converted: string | undefined
): { rateUnavailable: boolean; showConverted: boolean } {
  if (totalLabel === null || same) return { rateUnavailable: false, showConverted: false }
  if (converted === undefined) return { rateUnavailable: true, showConverted: false }
  return { rateUnavailable: false, showConverted: true }
}

function computeConverted(amount: number, rate: number | undefined): string | undefined {
  if (rate === undefined || isNaN(rate)) return undefined
  return formatAmount(amount * rate)
}

function computeRowDisplay(holding: Holding, totalTicker: Ticker | null, conversionRate: number | undefined) {
  const converted = computeConverted(holding.amount, conversionRate)
  const same = isSameCurrency(holding.ticker, totalTicker)
  const totalLabel = totalTicker ? totalTicker.ticker.toUpperCase() : null
  const { leftAmount, leftLabel } = computeLeftSide({
    holding,
    same,
    conversionRate,
    converted,
    totalLabel,
  })
  const { displayLabel, hasLabel } = holdingDisplayLabel(holding)
  const { rateUnavailable, showConverted } = holdingConversionFlags(totalLabel, same, converted)
  return { same, leftAmount, leftLabel, displayLabel, hasLabel, rateUnavailable, showConverted }
}

function computeLeftConverted(rate: number | undefined, converted: string | undefined): string {
  if (rate === undefined || isNaN(rate)) return ''
  return converted ?? ''
}

function computeLeftSide(params: {
  holding: Holding
  same: boolean
  conversionRate: number | undefined
  converted: string | undefined
  totalLabel: string | null
}) {
  const { holding, same, conversionRate, converted, totalLabel } = params
  if (same) {
    const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)
    return { leftAmount: formatAmount(holding.amount), leftLabel: unitOrTicker }
  }
  return { leftAmount: computeLeftConverted(conversionRate, converted), leftLabel: totalLabel }
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

  const { same, leftAmount, leftLabel, displayLabel, hasLabel, rateUnavailable, showConverted } = computeRowDisplay(
    holding,
    totalTicker,
    conversionRate
  )

  return (
    <>
      <TableRow className={disabled ? 'opacity-40 hover:opacity-60' : ''}>
        <AmountCell
          holding={holding}
          leftAmount={leftAmount}
          leftLabel={leftLabel}
          rateTooltip={<HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />}
          displayLabel={displayLabel}
          showConverted={showConverted}
          rateUnavailable={rateUnavailable}
          hasLabel={hasLabel}
          same={same}
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
