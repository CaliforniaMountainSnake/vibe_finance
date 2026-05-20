import { ExchangeRate, SourceName } from '@/entities/ExchangeRate'

export interface RepositoryInterface {
    sourceName: SourceName
    fetchRates(): Promise<ExchangeRate[]>
}
