'use client'

import { useState } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SourceIcon } from '@/components/icons/source-icon'
import { sourceDisplayName } from '@/lib/source-display-name'
import { formatAmount } from '@/lib/format-amount'
import { computeConverted } from '@/lib/compute-converted'
import { holdingUnit, isSameCurrency } from '@/lib/holding'
import { EditHoldingDialog } from './edit-holding-dialog'
import { HoldingRemoveDialog } from './holding-row-actions'
import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, EllipsisVertical, X, Eye, EyeOff, Pencil } from 'lucide-react'
import { CardDesktopActions } from './card-desktop-actions'

function SourceIconInline({ source }: { source: SourceName }) {
  return (
    <span className="inline-flex">
      <SourceIcon source={source} className="size-3 shrink-0 text-muted-foreground" />
    </span>
  )
}

/* ── HoldingTooltip ───────────────────── */

function TooltipRateLine({
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

function HoldingTooltipUnavailable() {
  return (
    <TooltipContent side="top">
      <span className="text-muted-foreground">Курс недоступен</span>
    </TooltipContent>
  )
}

function HoldingTooltipContent({
  holding,
  conversionRate,
  totalTicker,
}: {
  holding: Holding
  conversionRate: number
  totalTicker: Ticker | null
}) {
  const unit = holdingUnit(holding.ticker)
  const totalUnit = totalTicker ? holdingUnit(totalTicker) : ''
  const same = isSameCurrency(holding.ticker, totalTicker)
  return (
    <TooltipContent side="top" className="flex flex-col items-start">
      <span className="text-xs">{sourceDisplayName(holding.ticker.source)}</span>
      {holding.ticker.name ? <span className="font-medium">{holding.ticker.name}</span> : null}
      {totalTicker !== null ? (
        <TooltipRateLine unit={unit} rate={conversionRate} totalUnit={totalUnit} same={same} />
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
  const hasRate = conversionRate !== undefined && !isNaN(conversionRate)
  const hasContent = holding.ticker.name !== undefined || hasRate
  if (!hasContent) {
    return <HoldingTooltipUnavailable />
  }
  return <HoldingTooltipContent holding={holding} conversionRate={conversionRate as number} totalTicker={totalTicker} />
}

/* ── CardKebabMenu ────────────────────── */

type CardKebabMenuProps = {
  holdingId: string
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onRemoveClick: () => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
}

function CardKebabMenu({
  holdingId,
  isFirst,
  isLast,
  disabled,
  onRemoveClick,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
}: CardKebabMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label="Действия">
          <EllipsisVertical aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={isFirst} onClick={() => onMoveUp(holdingId)}>
          <ChevronUp aria-hidden="true" className="size-4" />
          Переместить вверх
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={() => onMoveDown(holdingId)}>
          <ChevronDown aria-hidden="true" className="size-4" />
          Переместить вниз
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleEnabled(holdingId)}>
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
  )
}

/* ── CardAmountTitle ──────────────────── */

function CardAmountTitle({
  holding,
  conversionRate,
  totalTicker,
}: {
  holding: Holding
  conversionRate: number | undefined
  totalTicker: Ticker | null
}) {
  const unitOrTicker = holding.ticker.unit ?? holding.ticker.ticker.toUpperCase()
  return (
    <CardTitle>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <SourceIconInline source={holding.ticker.source} />
            <span className="tabular-nums font-medium">{formatAmount(holding.amount)}</span>
            <span className="text-muted-foreground">{unitOrTicker}</span>
          </span>
        </TooltipTrigger>
        <HoldingTooltip holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />
      </Tooltip>
    </CardTitle>
  )
}

/* ── CardConvertedLine ───────────────── */

function CardConvertedLine({
  sameCurrency,
  converted,
  totalLabel,
}: {
  sameCurrency: boolean
  converted: string | undefined
  totalLabel: string | null
}) {
  if (sameCurrency || converted === undefined || totalLabel === null) return null
  return (
    <div className="text-sm tabular-nums leading-tight">
      ≈ {converted} <span className="text-muted-foreground">{totalLabel}</span>
    </div>
  )
}

/* ── CardAccountLabel ────────────────── */

function CardAccountLabel({ label, tickerName }: { label: string; tickerName?: string }) {
  const text = label || tickerName
  if (!text) return null
  return (
    <div className={cn('text-sm whitespace-normal break-words leading-snug', !label && 'text-muted-foreground')}>
      {text}
    </div>
  )
}

/* ── HoldingCardItem ──────────────────── */

export type HoldingCardItemProps = {
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

export function HoldingCardItem({
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
}: HoldingCardItemProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const disabled = !holding.enabled

  return (
    <>
      <Card size="sm" className={disabled ? 'opacity-40' : ''}>
        <CardHeader>
          <CardAmountTitle holding={holding} conversionRate={conversionRate} totalTicker={totalTicker} />
          <CardAction className="flex items-center gap-0.5">
            <CardDesktopActions
              holdingId={holding.id}
              isFirst={isFirst}
              isLast={isLast}
              disabled={disabled}
              onEditClick={() => setEditOpen(true)}
              onRemoveClick={() => setRemoveOpen(true)}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onToggleEnabled={onToggleEnabled}
            />
            <div className="md:hidden">
              <Button variant="ghost" size="icon-xs" aria-label="Редактировать" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" className="size-3" />
              </Button>
              <CardKebabMenu
                holdingId={holding.id}
                isFirst={isFirst}
                isLast={isLast}
                disabled={disabled}
                onRemoveClick={() => setRemoveOpen(true)}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onToggleEnabled={onToggleEnabled}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <CardConvertedLine
            sameCurrency={isSameCurrency(holding.ticker, totalTicker)}
            converted={computeConverted(holding.amount, conversionRate)}
            totalLabel={totalTicker ? totalTicker.ticker.toUpperCase() : null}
          />
          <CardAccountLabel label={holding.label} tickerName={holding.ticker.name} />
        </CardContent>
      </Card>

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
