'use client'

import { useEffect, useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { dbRepo } from '@/lib/db'
import { computeTotalAmount } from '@/lib/compute-total'
import { AddHoldingDialog } from './add-holding-dialog'
import { CurrencySearchProvider } from './currency-search-provider'
import { HoldingCardItem } from './holding-card-item'
import { HoldingsTotalCard } from './holdings-total-card'

async function computeRate(from: Ticker, to: Ticker): Promise<number | undefined> {
  const pair: TickerPair = { from, to }
  try {
    return await dbRepo.getRate(pair)
  } catch {
    return undefined
  }
}

async function computeConversionRates(
  holdings: Holding[],
  totalTicker: Ticker
): Promise<Record<string, number | undefined>> {
  const map: Record<string, number | undefined> = {}
  for (const h of holdings) {
    map[h.id] = await computeRate(h.ticker, totalTicker)
  }
  return map
}

function useHoldingsState(refreshKey: number) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [totalTicker, setTotalTicker] = useState<Ticker | null>(null)
  const [conversionRates, setConversionRates] = useState<Record<string, number | undefined>>({})

  useEffect(() => {
    void (async () => {
      const [hld, rates, total] = await Promise.all([
        dbRepo.getHoldings(),
        dbRepo.getAllRates(),
        dbRepo.getSetting('totalBaseTicker'),
      ])
      setHoldings(hld)
      setAllRates(rates)
      const tt = total ?? null
      setTotalTicker(tt)
      if (tt && hld.length > 0) {
        computeConversionRates(hld, tt).then(setConversionRates)
      }
    })()
  }, [refreshKey])

  async function refreshHoldingsAndRates() {
    const [hld, rates] = await Promise.all([dbRepo.getHoldings(), dbRepo.getAllRates()])
    setHoldings(hld)
    setAllRates(rates)
    updateConversionRates(hld, totalTicker)
  }

  function updateConversionRates(hld: Holding[], tt: Ticker | null) {
    if (!tt || hld.length === 0) {
      setConversionRates({})
      return
    }
    computeConversionRates(hld, tt).then(setConversionRates)
  }

  async function moveUp(id: string) {
    await dbRepo.moveHoldingUp(id)
    const updated = await dbRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function moveDown(id: string) {
    await dbRepo.moveHoldingDown(id)
    const updated = await dbRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function toggleEnabled(id: string) {
    const holding = holdings.find((h) => h.id === id)
    if (!holding) return
    await dbRepo.updateHolding(id, { enabled: !holding.enabled })
    const updated = await dbRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function remove(id: string) {
    await dbRepo.removeHolding(id)
    const updated = await dbRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  function changeTotal(ticker: Ticker | null) {
    setTotalTicker(ticker)
    updateConversionRates(holdings, ticker)
  }

  return {
    holdings,
    allRates,
    totalTicker,
    conversionRates,
    moveUp,
    moveDown,
    toggleEnabled,
    remove,
    changeTotal,
    refreshHoldingsAndRates,
  }
}

/* ── HoldingsCard ─────────────────── */

export function HoldingsCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const state = useHoldingsState(refreshKey)

  return (
    <CurrencySearchProvider allRates={state.allRates}>
      <Card>
        <CardHeader>
          <CardTitle>Мои средства</CardTitle>
          <CardAction className="flex items-center gap-1.5">
            <AddHoldingDialog allRates={state.allRates} onAdded={() => void state.refreshHoldingsAndRates()} />
          </CardAction>
        </CardHeader>
        <CardFooter className="block p-0">
          {state.holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Нет сохранённых средств. Добавьте кнопкой справа вверху.
            </p>
          ) : (
            <div>
              {state.holdings.map((holding, index) => (
                <HoldingCardItem
                  key={holding.id}
                  holding={holding}
                  isFirst={index === 0}
                  isLast={index === state.holdings.length - 1}
                  conversionRate={state.conversionRates[holding.id]}
                  totalTicker={state.totalTicker}
                  allRates={state.allRates}
                  onMoveUp={(id) => void state.moveUp(id)}
                  onMoveDown={(id) => void state.moveDown(id)}
                  onToggleEnabled={(id) => void state.toggleEnabled(id)}
                  onRemove={(id) => void state.remove(id)}
                  onEdited={() => void state.refreshHoldingsAndRates()}
                />
              ))}
              <HoldingsTotalCard
                totalAmount={computeTotalAmount(state.holdings, state.conversionRates)}
                totalTicker={state.totalTicker}
                totalUnit={state.totalTicker?.unit ?? null}
                allRates={state.allRates}
                onTotalTickerChange={state.changeTotal}
              />
            </div>
          )}
        </CardFooter>
      </Card>
    </CurrencySearchProvider>
  )
}
