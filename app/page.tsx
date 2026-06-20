'use client'

import { useCallback, useState } from 'react'
import { useSettings } from '@/app/providers/settings-provider'
import { cn } from '@/lib/utilities'
import { ExchangeRateRefreshCard } from './_components/exchange-rate-refresh-card'
import { FavoriteRatesCard } from './_components/favorite-rates-card'
import { HoldingsCard } from './_components/holdings-card'

export default function App() {
  const { cardPaddingRemovedLarge, cardPaddingRemovedSmall } = useSettings()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefreshed = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col flex-1 gap-3 mx-auto w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl',
        'p-2',
        cardPaddingRemovedLarge && 'sm:p-0',
        cardPaddingRemovedSmall && 'max-sm:p-0'
      )}
    >
      <ExchangeRateRefreshCard onRefreshed={handleRefreshed} onRestored={handleRefreshed} />
      <FavoriteRatesCard refreshKey={refreshKey} />
      <HoldingsCard refreshKey={refreshKey} />
    </div>
  )
}
