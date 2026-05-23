import { ExchangeRateRefreshCard } from './_components/exchange-rate-refresh-card'

export default function Home() {
  return (
    <div className="flex flex-col flex-1 p-4 sm:p-8 max-w-md mx-auto w-full gap-6">
      <ExchangeRateRefreshCard />
    </div>
  )
}
