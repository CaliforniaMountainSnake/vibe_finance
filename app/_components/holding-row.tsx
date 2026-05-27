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
import { sourceDisplayName } from '@/lib/source-display-name'

function SourceIconWithTooltip({ source }: { source: SourceName }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <SourceIcon source={source} className="size-3 shrink-0 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{sourceDisplayName(source)}</TooltipContent>
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
  rateTooltip,
}: {
  holding: Holding
  converted: string | undefined
  totalLabel: string | null
  showConverted: boolean
  rateTooltip: React.ReactNode
}) {
  const unitOrTicker = holding.ticker.unit ?? tickerLabel(holding.ticker)
  return (
    <TableCell>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
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
          </span>
        </TooltipTrigger>
        {rateTooltip}
      </Tooltip>
    </TableCell>
  )
}

/* ── LabelCell ─────────────────────────── */

function LabelCell({ label, tickerName }: { label: string; tickerName?: string }) {
  const displayText = label || tickerName
  const isFallback = !label

  if (!displayText) {
    return (
      <TableCell>
        <span className="text-sm whitespace-normal break-words">—</span>
      </TableCell>
    )
  }

  return (
    <TableCell>
      <span className={`text-sm whitespace-normal break-words${isFallback ? ' text-muted-foreground' : ''}`}>
        {displayText}
      </span>
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

function HoldingTooltipRate({
  unit,
  rate,
  totalUnit,
  same,
}: {
  unit: string
  rate: number
  totalUnit: string
  same: boolean
}) {
  if (same) {
    return (
      <span className="tabular-nums">
        1 {unit} = 1 {totalUnit}
      </span>
    )
  }
  return (
    <span className="tabular-nums">
      1 {unit} ≈ {formatAmount(rate)} {totalUnit}
    </span>
  )
}

function HoldingTooltipName({ name }: { name: string }) {
  return <span className="font-medium">{name}</span>
}

function HoldingTooltipContent({
  holding,
  unit,
  hasName,
  hasRate,
  conversionRate,
  totalTicker,
  totalUnit,
  same,
}: {
  holding: Holding
  unit: string
  hasName: boolean
  hasRate: boolean
  conversionRate: number
  totalTicker: Ticker | null
  totalUnit: string
  same: boolean
}) {
  return (
    <TooltipContent side="top" className="flex flex-col items-start">
      {hasName && holding.ticker.name ? <HoldingTooltipName name={holding.ticker.name} /> : null}
      {hasRate && totalTicker !== null ? (
        <HoldingTooltipRate unit={unit} rate={conversionRate} totalUnit={totalUnit} same={same} />
      ) : null}
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
  const hasRate = conversionRate !== undefined && !isNaN(conversionRate)
  const hasContent = holding.ticker.name !== undefined || hasRate

  if (!hasContent) {
    return (
      <TooltipContent side="top">
        <span className="text-muted-foreground">Курс недоступен</span>
      </TooltipContent>
    )
  }

  return (
    <HoldingTooltipContent
      holding={holding}
      unit={unit}
      hasName={holding.ticker.name !== undefined}
      hasRate={hasRate}
      conversionRate={conversionRate as number}
      totalTicker={totalTicker}
      totalUnit={totalTicker ? holdingUnit(totalTicker) : ''}
      same={isSameCurrency(holding.ticker, totalTicker)}
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
  const totalLabel = totalTicker ? totalTicker.ticker.toUpperCase() : null
  const sameCurrency =
    totalTicker !== null && holding.ticker.source === totalTicker.source && holding.ticker.ticker === totalTicker.ticker

  return (
    <>
      <TableRow className={disabled ? 'opacity-40 hover:opacity-60' : ''}>
        <AmountCell
          holding={holding}
          converted={converted}
          totalLabel={totalLabel}
          showConverted={!sameCurrency}
          rateTooltip={<HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />}
        />
        <LabelCell label={holding.label} tickerName={holding.ticker.name} />
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
