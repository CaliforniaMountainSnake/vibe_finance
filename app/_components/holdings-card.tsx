'use client'

import { useEffect, useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExchangeRate } from '@/entities/exchange-rate'
import type { Holding } from '@/entities/holding'
import type { Ticker } from '@/entities/ticker'
import { useDatabase } from '@/app/providers/database-provider'
import { computeConversionRates } from '@/lib/compute-conversion-rates'
import { HoldingsTable } from './holdings-table'
import { AddHoldingDialog } from './add-holding-dialog'
import { CurrencySearchProvider } from '@/app/providers/currency-search-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

function useHoldingsState(refreshKey: number, databaseRepo: DatabaseRepositoryInterface) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [totalTicker, setTotalTicker] = useState<Ticker>()
  const [conversionRates, setConversionRates] = useState<Record<string, number | undefined>>({})

  useEffect(() => {
    void (async () => {
      const [hld, rates, total] = await Promise.all([
        databaseRepo.getHoldings(),
        databaseRepo.getAllRates(),
        databaseRepo.getSetting('totalBaseTicker'),
      ])
      setHoldings(hld)
      setAllRates(rates)
      const tt = total ?? undefined
      setTotalTicker(tt)
      if (tt && hld.length > 0) {
        computeConversionRates(databaseRepo, hld, tt).then(setConversionRates)
      }
    })()
  }, [refreshKey, databaseRepo])

  async function refreshHoldingsAndRates() {
    const [hld, rates] = await Promise.all([databaseRepo.getHoldings(), databaseRepo.getAllRates()])
    setHoldings(hld)
    setAllRates(rates)
    updateConversionRates(hld, totalTicker)
  }

  function updateConversionRates(hld: Holding[], tt: Ticker | undefined) {
    if (!tt || hld.length === 0) {
      setConversionRates({})
      return
    }
    computeConversionRates(databaseRepo, hld, tt).then(setConversionRates)
  }

  async function moveUp(id: string) {
    await databaseRepo.moveHoldingUp(id)
    const updated = await databaseRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function moveDown(id: string) {
    await databaseRepo.moveHoldingDown(id)
    const updated = await databaseRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function toggleEnabled(id: string) {
    const holding = holdings.find((h) => h.id === id)
    if (!holding) return
    await databaseRepo.updateHolding(id, { enabled: !holding.enabled })
    const updated = await databaseRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  async function remove(id: string) {
    await databaseRepo.removeHolding(id)
    const updated = await databaseRepo.getHoldings()
    setHoldings(updated)
    updateConversionRates(updated, totalTicker)
  }

  function changeTotal(ticker: Ticker | undefined) {
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
  const databaseRepo = useDatabase()
  const state = useHoldingsState(refreshKey, databaseRepo)

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
            <HoldingsTable
              holdings={state.holdings}
              allRates={state.allRates}
              conversionRates={state.conversionRates}
              totalTicker={state.totalTicker}
              onTotalTickerChange={state.changeTotal}
              onMoveUp={(id) => void state.moveUp(id)}
              onMoveDown={(id) => void state.moveDown(id)}
              onToggleEnabled={(id) => void state.toggleEnabled(id)}
              onRemove={(id) => void state.remove(id)}
              onEdited={() => void state.refreshHoldingsAndRates()}
            />
          )}
        </CardFooter>
      </Card>
    </CurrencySearchProvider>
  )
}
