import type { ExchangeRate, SourceName } from '@/entities/exchange-rate'

export interface FinanceApiRepositoryInterface {
  sourceName: SourceName
  fetchRates(): Promise<ExchangeRate[]>
  parseRates(raw: string): ExchangeRate[]
}
