'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
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

/* ── ConvertedCell ─────────────────────── */

function ConvertedCell({
  same,
  showConverted,
  rateUnavailable,
  convertedAmount,
  totalLabel,
  source,
}: {
  same: boolean
  showConverted: boolean
  rateUnavailable: boolean
  convertedAmount: string
  totalLabel: string | null
  source: SourceName
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm tabular-nums whitespace-nowrap">
      <SourceIcon source={source} className="size-3 shrink-0 text-muted-foreground" />
      {rateUnavailable && <span className="text-destructive">Курс недоступен</span>}
      {same && totalLabel && (
        <span>
          <span className="font-medium">{convertedAmount}</span>{' '}
          <span className="text-muted-foreground">{totalLabel}</span>
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

/* ── OriginalCell ──────────────────────── */

function OriginalCell({
  amount,
  unitOrTicker,
  invisible,
}: {
  amount: string
  unitOrTicker: string
  invisible: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 whitespace-nowrap${invisible ? ' invisible' : ''}`}>
      <span className="text-sm tabular-nums font-medium">{amount}</span>
      <span className="text-muted-foreground text-sm tabular-nums">{unitOrTicker}</span>
    </div>
  )
}

/* ── ActionsCell ───────────────────────── */

function ActionsCell({
  isFirst,
  isLast,
  disabled,
  holdingId,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onEditClick,
  onRemoveClick,
}: {
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  holdingId: string
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
  onEditClick: () => void
  onRemoveClick: () => void
}) {
  return (
    <TableCell className="w-px whitespace-nowrap" rowSpan={2}>
      <HoldingMobileActions
        isFirst={isFirst}
        isLast={isLast}
        disabled={disabled}
        onMoveUp={() => onMoveUp(holdingId)}
        onMoveDown={() => onMoveDown(holdingId)}
        onToggleEnabled={() => onToggleEnabled(holdingId)}
        onEditClick={onEditClick}
        onRemoveClick={onRemoveClick}
      />
      <HoldingDesktopActions
        isFirst={isFirst}
        isLast={isLast}
        disabled={disabled}
        onMoveUp={() => onMoveUp(holdingId)}
        onMoveDown={() => onMoveDown(holdingId)}
        onToggleEnabled={() => onToggleEnabled(holdingId)}
        onEditClick={onEditClick}
        onRemoveClick={onRemoveClick}
      />
    </TableCell>
  )
}

/* ── LabelCell ─────────────────────────── */

function LabelCell({ label }: { label: string }) {
  if (!label) return null
  return <span className="text-sm leading-tight">{label}</span>
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

function holdingLabel(holding: Holding): string {
  return holding.label || (holding.ticker.name ?? '')
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

function computeLeftConverted(rate: number | undefined, converted: string | undefined): string {
  if (rate === undefined || isNaN(rate)) return ''
  return converted ?? ''
}

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
  const rowClass = disabled ? 'opacity-40 hover:opacity-60' : ''

  const { same, leftAmount, leftLabel, label, rateUnavailable, showConverted } = computeRowDisplay(
    holding,
    totalTicker,
    conversionRate
  )

  const tooltip = <HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />
  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)

  return (
    <>
      {/* ── amounts row ── */}
      <TableRow className={`border-b-0 ${rowClass}`}>
        <TableCell className="w-full pb-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block w-full">
                <ConvertedCell
                  same={same}
                  showConverted={showConverted}
                  rateUnavailable={rateUnavailable}
                  convertedAmount={leftAmount}
                  totalLabel={leftLabel}
                  source={holding.ticker.source}
                />
              </span>
            </TooltipTrigger>
            {tooltip}
          </Tooltip>
        </TableCell>
        <TableCell className="whitespace-nowrap pb-0">
          <OriginalCell amount={formatAmount(holding.amount)} unitOrTicker={unitOrTicker} invisible={same} />
        </TableCell>
        <ActionsCell
          isFirst={isFirst}
          isLast={isLast}
          disabled={disabled}
          holdingId={holding.id}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onToggleEnabled={onToggleEnabled}
          onEditClick={() => setEditOpen(true)}
          onRemoveClick={() => setRemoveOpen(true)}
        />
      </TableRow>

      {/* ── labels row ── */}
      <TableRow className={`border-t-0 ${rowClass}`}>
        <TableCell className="pt-0.5" colSpan={2}>
          <LabelCell label={label} />
        </TableCell>
      </TableRow>

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
    </>
  )
}
