'use client'

import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'
import { TooltipContent } from '@/components/ui/tooltip'
import { sourceDisplayName } from '@/lib/source-display-name'
import { useLocale } from '@/app/providers/locale-provider'
import { formatAmount } from '@/lib/format-amount'

function holdingUnit(t: Ticker): string {
  return t.unit ?? t.ticker.toUpperCase()
}

function isSameCurrency(ticker: Ticker, totalTicker: Ticker | undefined): boolean {
  return totalTicker !== undefined && ticker.source === totalTicker.source && ticker.ticker === totalTicker.ticker
}

function TooltipRateOrFallback({
  unit,
  conversionRate,
  totalUnit,
  same,
  locale,
}: {
  unit: string
  conversionRate: number | undefined
  totalUnit: string
  same: boolean
  locale: string
}) {
  if (same) {
    return false
  }
  if (conversionRate === undefined || Number.isNaN(conversionRate)) {
    return <span className="text-muted-foreground">Курс недоступен</span>
  }
  return (
    <span className="tabular-nums">
      1 {unit} ≈ {formatAmount(conversionRate, locale)} {totalUnit}
    </span>
  )
}

function TooltipContentInner({
  holding,
  unit,
  conversionRate,
  totalUnit,
  same,
  locale,
}: {
  holding: Holding
  unit: string
  conversionRate: number | undefined
  totalUnit: string
  same: boolean
  locale: string
}) {
  return (
    <TooltipContent side="top" className="flex flex-col items-start">
      <span>{sourceDisplayName(holding.ticker.source)}</span>
      {holding.ticker.name && <span className="font-medium">{holding.ticker.name}</span>}
      <TooltipRateOrFallback
        unit={unit}
        conversionRate={conversionRate}
        totalUnit={totalUnit}
        same={same}
        locale={locale}
      />
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
  totalTicker: Ticker | undefined
}) {
  const unit = holdingUnit(holding.ticker)
  const totalUnit = totalTicker ? holdingUnit(totalTicker) : ''
  const same = isSameCurrency(holding.ticker, totalTicker)
  const locale = useLocale()

  return (
    <TooltipContentInner
      holding={holding}
      unit={unit}
      conversionRate={conversionRate}
      totalUnit={totalUnit}
      same={same}
      locale={locale}
    />
  )
}
