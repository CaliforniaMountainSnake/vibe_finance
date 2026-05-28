'use client'

// Card components replaced with plain divs
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/format-amount'
import { TotalCurrencyPicker } from './total-currency-picker'
import type { Ticker } from '@/entities/Ticker'
import type { ExchangeRate } from '@/entities/ExchangeRate'

type HoldingsTotalCardProps = {
  totalAmount: number
  totalTicker: Ticker | null
  totalUnit: string | null
  allRates: ExchangeRate[]
  onTotalTickerChange: (ticker: Ticker | null) => void
}

export function HoldingsTotalCard({
  totalAmount,
  totalTicker,
  totalUnit,
  allRates,
  onTotalTickerChange,
}: HoldingsTotalCardProps) {
  return (
    <div className="bg-muted/30 border-t px-4 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-between">
        <div className={cn('font-heading text-sm leading-snug font-medium', '!text-sm')}>
          <span className="tabular-nums font-semibold">{totalTicker ? formatAmount(totalAmount) : '—'}</span>
          {totalUnit && <span className="text-muted-foreground ml-1">{totalUnit}</span>}
        </div>
        <div className="flex-shrink-0">
          <TotalCurrencyPicker allRates={allRates} value={totalTicker} onChange={onTotalTickerChange} />
        </div>
      </div>
    </div>
  )
}
