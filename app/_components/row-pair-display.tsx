'use client'

import { useState, type ReactNode } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import type { SourceName } from '@/entities/ExchangeRate'
import { HoldingMobileActions, HoldingDesktopActions } from './holding-row-actions'
import { SourceIcon } from '@/components/icons/source-icon'
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip'

/* ── ConvertedCell ─────────────────────── */

function ConvertedCell({
  same,
  showConverted,
  rateUnavailable,
  convertedAmount,
  totalLabel,
  source,
  tooltip,
}: {
  same: boolean
  showConverted: boolean
  rateUnavailable: boolean
  convertedAmount: string
  totalLabel: string | null
  source: SourceName
  tooltip: ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm tabular-nums whitespace-nowrap">
      <SourceIcon source={source} className="size-3 shrink-0 text-muted-foreground" />
      {rateUnavailable && <span className="text-destructive">Курс недоступен</span>}
      {same && totalLabel && (
        <span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium">{convertedAmount}</span>
            </TooltipTrigger>
            {tooltip}
          </Tooltip>{' '}
          <span className="text-muted-foreground">{totalLabel}</span>
        </span>
      )}
      {showConverted && (
        <>
          <span className="text-muted-foreground">≈</span>{' '}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium">{convertedAmount}</span>
            </TooltipTrigger>
            {tooltip}
          </Tooltip>{' '}
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

/* ── RowPairDisplay ────────────────────── */

export type RowPairDisplayProps = {
  same: boolean
  showConverted: boolean
  rateUnavailable: boolean
  leftAmount: string
  leftLabel: string | null
  source: SourceName
  amount: string
  unitOrTicker: string
  label: string
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  holdingId: string
  children: ReactNode
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
  onEditClick: () => void
  onRemoveClick: () => void
  tooltip: ReactNode
}

export function RowPairDisplay({
  same,
  showConverted,
  rateUnavailable,
  leftAmount,
  leftLabel,
  source,
  amount,
  unitOrTicker,
  label,
  isFirst,
  isLast,
  disabled,
  holdingId,
  children,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onEditClick,
  onRemoveClick,
  tooltip,
}: RowPairDisplayProps) {
  const [hovered, setHovered] = useState(false)
  const bg = hovered ? 'bg-muted/50' : ''
  const opacity = disabled ? 'opacity-40' : ''
  const rowClass = `${opacity} ${hovered && disabled ? 'opacity-60' : ''}`
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  }

  return (
    <>
      {/* ── amounts row ── */}
      <TableRow className={`border-b-0 ${bg} ${rowClass}`} {...handlers}>
        <TableCell className="w-full pb-0">
          <ConvertedCell
            same={same}
            showConverted={showConverted}
            rateUnavailable={rateUnavailable}
            convertedAmount={leftAmount}
            totalLabel={leftLabel}
            source={source}
            tooltip={tooltip}
          />
        </TableCell>
        <TableCell className="whitespace-nowrap pb-0">
          <OriginalCell amount={amount} unitOrTicker={unitOrTicker} invisible={same} />
        </TableCell>
        <ActionsCell
          isFirst={isFirst}
          isLast={isLast}
          disabled={disabled}
          holdingId={holdingId}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onToggleEnabled={onToggleEnabled}
          onEditClick={onEditClick}
          onRemoveClick={onRemoveClick}
        />
      </TableRow>

      {/* ── labels row ── */}
      <TableRow className={`border-t-0 ${bg} ${rowClass}`} {...handlers}>
        <TableCell className="pt-0.5" colSpan={2}>
          <LabelCell label={label} />
        </TableCell>
      </TableRow>

      {children}
    </>
  )
}
