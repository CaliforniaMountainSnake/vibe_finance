'use client'

import { useEffect, useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { Holding } from '@/entities/Holding'
import type { Ticker } from '@/entities/Ticker'
import type { TickerPair } from '@/entities/TickerPair'
import { dbRepo } from '@/lib/db'
import { convert, type ConvertedResult } from '@/lib/conversion'
import { AddHoldingDialog } from './add-holding-dialog'
import { CurrencySearchProvider } from './currency-search-provider'
import { HoldingCardItem } from './holding-card-item'
import { HoldingsTotalCard } from './holdings-total-card'

function computeTotalFromResults(holdings: Holding[], results: ConvertedResult[]): number {
  const rateById = new Map(results.map((r) => [r.holdingId, r.rate]))
  return holdings
    .filter((h) => h.enabled)
    .reduce((sum, h) => {
      const rate = rateById.get(h.id)
      if (rate === undefined || isNaN(rate)) return sum
      return sum + h.amount * rate
    }, 0)
}

function getRateAdapter(): (pair: TickerPair) => Promise<number | undefined> {
  return async (pair: TickerPair) => {
    try {
      return await dbRepo.getRate(pair)
    } catch {
      return undefined
    }
  }
}

function useHoldingsState(refreshKey: number) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [totalTicker, setTotalTicker] = useState<Ticker | null>(null)
  const [convertedResults, setConvertedResults] = useState<ConvertedResult[]>([])

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
        convert(hld, getRateAdapter(), tt).then(setConvertedResults)
      }
    })()
  }, [refreshKey])

  async function refreshHoldingsAndRates() {
    const [hld, rates] = await Promise.all([dbRepo.getHoldings(), dbRepo.getAllRates()])
    setHoldings(hld)
    setAllRates(rates)
    updateConvertedResults(hld, totalTicker)
  }

  function updateConvertedResults(hld: Holding[], tt: Ticker | null) {
    if (!tt || hld.length === 0) {
      setConvertedResults([])
      return
    }
    convert(hld, getRateAdapter(), tt).then(setConvertedResults)
  }

  async function afterMutation(dbAction: Promise<unknown>): Promise<void> {
    await dbAction
    const updated = await dbRepo.getHoldings()
    setHoldings(updated)
    updateConvertedResults(updated, totalTicker)
  }

  async function moveUp(id: string) {
    await afterMutation(dbRepo.moveHoldingUp(id))
  }

  async function moveDown(id: string) {
    await afterMutation(dbRepo.moveHoldingDown(id))
  }

  async function toggleEnabled(id: string) {
    const holding = holdings.find((h) => h.id === id)
    if (!holding) return
    await afterMutation(dbRepo.updateHolding(id, { enabled: !holding.enabled }))
  }

  async function remove(id: string) {
    await afterMutation(dbRepo.removeHolding(id))
  }

  function changeTotal(ticker: Ticker | null) {
    setTotalTicker(ticker)
    updateConvertedResults(holdings, ticker)
  }

  const conversionRates: Record<string, number | undefined> = Object.fromEntries(
    convertedResults.map((r) => [r.holdingId, r.rate])
  )
  const convertedById = new Map(convertedResults.map((r) => [r.holdingId, r.converted]))

  return {
    holdings,
    allRates,
    totalTicker,
    conversionRates,
    convertedById,
    convertedResults,
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
                  converted={state.convertedById.get(holding.id)}
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
                totalAmount={computeTotalFromResults(state.holdings, state.convertedResults)}
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
