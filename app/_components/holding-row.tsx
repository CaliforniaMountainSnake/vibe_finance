'use client'

import { useState } from 'react'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { EditHoldingDialog } from './edit-holding-dialog'
import { HoldingRemoveDialog } from './holding-row-actions'
import { formatAmount } from '@/lib/format-amount'
import { RowPairDisplay } from './row-pair-display'
import { HoldingTooltip } from './holding-tooltip'

/* ── helpers ─────────────────────────────── */

function tickerLabel(t: Ticker): string {
  return t.ticker.toUpperCase()
}

function isSameCurrency(ticker: Ticker, totalTicker: Ticker | null): boolean {
  return totalTicker !== null && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}

function holdingLabel(holding: Holding): string {
  return holding.label || (holding.ticker.name ?? '')
}

function computeConverted(amount: number, rate: number | undefined): string | undefined {
  if (rate === undefined || isNaN(rate)) return undefined
  return formatAmount(amount * rate)
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
  const label = holdingLabel(holding)
  const { rateUnavailable, showConverted } = holdingConversionFlags(totalLabel, same, converted)
  return { same, leftAmount, leftLabel, label, rateUnavailable, showConverted }
}

/* ── HoldingDialogs ──────────────────────── */

function HoldingDialogs({
  removeOpen,
  setRemoveOpen,
  editOpen,
  setEditOpen,
  holding,
  allRates,
  onRemove,
  onEdited,
}: {
  removeOpen: boolean
  setRemoveOpen: (v: boolean) => void
  editOpen: boolean
  setEditOpen: (v: boolean) => void
  holding: Holding
  allRates: ExchangeRate[]
  onRemove: (id: string) => void
  onEdited: () => void
}) {
  return (
    <>
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

/* ── HoldingRow ────────────────────────────── */

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

  const { same, leftAmount, leftLabel, label, rateUnavailable, showConverted } = computeRowDisplay(
    holding,
    totalTicker,
    conversionRate
  )

  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)

  return (
    <RowPairDisplay
      same={same}
      showConverted={showConverted}
      rateUnavailable={rateUnavailable}
      leftAmount={leftAmount}
      leftLabel={leftLabel}
      source={holding.ticker.source}
      amount={formatAmount(holding.amount)}
      unitOrTicker={unitOrTicker}
      label={label}
      hasLabel={!!holding.label}
      isFirst={isFirst}
      isLast={isLast}
      disabled={disabled}
      holdingId={holding.id}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleEnabled={onToggleEnabled}
      onEditClick={() => setEditOpen(true)}
      onRemoveClick={() => setRemoveOpen(true)}
      tooltip={<HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />}
    >
      <HoldingDialogs
        removeOpen={removeOpen}
        setRemoveOpen={setRemoveOpen}
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        holding={holding}
        allRates={allRates}
        onRemove={onRemove}
        onEdited={onEdited}
      />
    </RowPairDisplay>
  )
}
