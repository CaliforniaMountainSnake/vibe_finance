'use client'

import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { TooltipContent } from '@/components/ui/tooltip'
import { sourceDisplayName } from '@/lib/source-display-name'
import { formatAmount } from '@/lib/format-amount'

function holdingUnit(t: Ticker): string {
  return t.unit ?? t.ticker.toUpperCase()
}

function isSameCurrency(ticker: Ticker, totalTicker: Ticker | null): boolean {
  return totalTicker !== null && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}

function TooltipRateOrFallback({
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

function TooltipContentInner({
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
      <TooltipRateOrFallback unit={unit} conversionRate={conversionRate} totalUnit={totalUnit} same={same} />
    </TooltipContent>
  )
}

export function HoldingTooltip({
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
    <TooltipContentInner
      holding={holding}
      unit={unit}
      conversionRate={conversionRate}
      totalUnit={totalUnit}
      same={same}
    />
  )
}
