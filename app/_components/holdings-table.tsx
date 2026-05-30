'use client'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import { HoldingRow } from './holding-row'
import { formatAmount } from '@/lib/format-amount'
import { TotalCurrencyPicker } from './total-currency-picker'

function computeTotalAmount(holdings: Holding[], conversionRates: Record<string, number | undefined>): number {
  return holdings
    .filter((h) => h.enabled)
    .reduce((sum, h) => {
      const rate = conversionRates[h.id]
      if (rate === undefined || isNaN(rate)) return sum
      return sum + h.amount * rate
    }, 0)
}

function TotalRow({
  totalAmount,
  totalTicker,
  totalUnit,
  allRates,
  onTotalTickerChange,
}: {
  totalAmount: number
  totalTicker: Ticker | null
  totalUnit: string | null
  allRates: ExchangeRate[]
  onTotalTickerChange: (ticker: Ticker | null) => void
}) {
  return (
    <TableRow>
      <TableCell colSpan={3}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex size-3 shrink-0" />
            <span className="text-sm tabular-nums font-semibold">{totalTicker ? formatAmount(totalAmount) : '—'}</span>
            {totalUnit && <span className="text-muted-foreground text-sm">{totalUnit}</span>}
          </div>
          <TotalCurrencyPicker allRates={allRates} value={totalTicker} onChange={onTotalTickerChange} />
        </div>
      </TableCell>
    </TableRow>
  )
}

type HoldingsTableProps = {
  holdings: Holding[]
  allRates: ExchangeRate[]
  conversionRates: Record<string, number | undefined>
  totalTicker: Ticker | null
  onTotalTickerChange: (ticker: Ticker | null) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
  onRemove: (id: string) => void
  onEdited: () => void
}

export function HoldingsTable({
  holdings,
  allRates,
  conversionRates,
  totalTicker,
  onTotalTickerChange,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
  onRemove,
  onEdited,
}: HoldingsTableProps) {
  const totalAmount = computeTotalAmount(holdings, conversionRates)
  const totalUnit = totalTicker?.unit ?? null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Сумма</TableHead>
          <TableHead>Счёт</TableHead>
          <TableHead className="w-px" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((holding, index) => (
          <HoldingRow
            key={holding.id}
            holding={holding}
            isFirst={index === 0}
            isLast={index === holdings.length - 1}
            conversionRate={conversionRates[holding.id]}
            totalTicker={totalTicker}
            allRates={allRates}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onToggleEnabled={onToggleEnabled}
            onRemove={onRemove}
            onEdited={onEdited}
          />
        ))}
      </TableBody>
      <TableFooter>
        <TotalRow
          totalAmount={totalAmount}
          totalTicker={totalTicker}
          totalUnit={totalUnit}
          allRates={allRates}
          onTotalTickerChange={onTotalTickerChange}
        />
      </TableFooter>
    </Table>
  )
}
