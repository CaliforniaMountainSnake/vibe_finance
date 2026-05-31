'use client'

import { createContext, useContext, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { ExchangeRate } from '@/entities/exchange-rate'

const CurrencySearchContext = createContext<Fuse<ExchangeRate> | undefined>(undefined)

export function CurrencySearchProvider({
  allRates,
  children,
}: {
  allRates: ExchangeRate[]
  children: React.ReactNode
}) {
  const fuse = useMemo(
    () =>
      new Fuse(allRates, {
        keys: [
          { name: 'ticker', weight: 0.5 },
          { name: 'name', weight: 0.35 },
          { name: 'source', weight: 0.15 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [allRates]
  )
  return <CurrencySearchContext.Provider value={fuse}>{children}</CurrencySearchContext.Provider>
}

export function useCurrencySearch(): Fuse<ExchangeRate> | undefined {
  return useContext(CurrencySearchContext)
}
