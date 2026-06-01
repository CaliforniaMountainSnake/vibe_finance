'use client'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'
import { HoldingRow } from './holding-row'
import { useLocale } from '@/app/providers/locale-provider'
import { formatAmount } from '@/lib/format-amount'
import { computeHoldingsTotal } from '@/lib/compute-holdings-total'
import { TotalCurrencyPicker } from './total-currency-picker'

function TotalUnitLabel({ unit }: { unit: string | undefined }) {
  return unit && <span className="text-muted-foreground text-sm"> {unit}</span>
}

function TotalAmountDisplay({
  total,
  totalTicker,
  totalUnit,
}: {
  total: ReturnType<typeof computeHoldingsTotal>
  totalTicker: Ticker | undefined
  totalUnit: string | undefined
}) {
  const locale = useLocale()

  if (!totalTicker) {
    return <span className="text-sm tabular-nums font-semibold">—</span>
  }
  if (total.contributedCount === 0 && total.skippedCount > 0) {
    return (
      <span>
        <span className="text-sm tabular-nums font-semibold text-destructive">Курс недоступен</span>
        <TotalUnitLabel unit={totalUnit} />
      </span>
    )
  }
  return (
    <span>
      <span className="text-sm tabular-nums font-semibold">{formatAmount(total.totalAmount, locale)}</span>
      <TotalUnitLabel unit={totalUnit} />
    </span>
  )
}

function TotalRow({
  total,
  totalTicker,
  totalUnit,
  allRates,
  onTotalTickerChange,
}: {
  total: ReturnType<typeof computeHoldingsTotal>
  totalTicker: Ticker | undefined
  totalUnit: string | undefined
  allRates: ExchangeRate[]
  onTotalTickerChange: (ticker: Ticker | undefined) => void
}) {
  return (
    <TableRow>
      <TableCell colSpan={3}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex size-3 shrink-0" />
            <TotalAmountDisplay total={total} totalTicker={totalTicker} totalUnit={totalUnit} />
          </div>
          <TotalCurrencyPicker allRates={allRates} value={totalTicker} onChange={onTotalTickerChange} />
        </div>
      </TableCell>
    </TableRow>
  )
}

type HoldingsTableProperties = {
  holdings: Holding[]
  allRates: ExchangeRate[]
  conversionRates: Record<string, number | undefined>
  totalTicker: Ticker | undefined
  onTotalTickerChange: (ticker: Ticker | undefined) => void
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
}: HoldingsTableProperties) {
  const total = computeHoldingsTotal(holdings, conversionRates)
  const totalUnit = totalTicker?.unit

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Сумма</TableHead>
          <TableHead />
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
          total={total}
          totalTicker={totalTicker}
          totalUnit={totalUnit}
          allRates={allRates}
          onTotalTickerChange={onTotalTickerChange}
        />
      </TableFooter>
    </Table>
  )
}
