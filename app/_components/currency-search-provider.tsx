'use client'

import { createContext, useContext, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { ExchangeRate } from '@/entities/ExchangeRate'

const CurrencySearchCtx = createContext<Fuse<ExchangeRate> | null>(null)

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
  return <CurrencySearchCtx.Provider value={fuse}>{children}</CurrencySearchCtx.Provider>
}

export function useCurrencySearch(): Fuse<ExchangeRate> | null {
  return useContext(CurrencySearchCtx)
}
