import type { ExchangeRate, SourceName } from '@/entities/ExchangeRate'

export interface FinanceApiRepositoryInterface {
  sourceName: SourceName
  fetchRates(): Promise<ExchangeRate[]>
  parseRates(raw: string): ExchangeRate[]
}
