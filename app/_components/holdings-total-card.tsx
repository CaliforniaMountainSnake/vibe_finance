'use client'

import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card size="sm" className="bg-muted/50">
      <CardHeader>
        <CardTitle className="!text-sm">
          <span className="tabular-nums font-semibold">{totalTicker ? formatAmount(totalAmount) : '—'}</span>
          {totalUnit && <span className="text-muted-foreground ml-1">{totalUnit}</span>}
        </CardTitle>
        <CardAction>
          <TotalCurrencyPicker allRates={allRates} value={totalTicker} onChange={onTotalTickerChange} />
        </CardAction>
      </CardHeader>
    </Card>
  )
}
