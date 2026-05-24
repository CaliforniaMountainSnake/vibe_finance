'use client'

import { useCallback, useState } from 'react'
import { ExchangeRateRefreshCard } from './_components/exchange-rate-refresh-card'
import { FavoriteRatesCard } from './_components/favorite-rates-card'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefreshed = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="flex flex-col flex-1 p-2 gap-3 mx-auto w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
      <ExchangeRateRefreshCard onRefreshed={handleRefreshed} />
      <FavoriteRatesCard refreshKey={refreshKey} />
    </div>
  )
}
