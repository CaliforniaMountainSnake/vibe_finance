import { readFileSync } from 'node:fs'
import path from 'node:path'
import { BinanceRepository } from '@/repositories/binance-repository'
import { BybitRepository } from '@/repositories/bybit-repository'
import { CoinGeckoRepository } from '@/repositories/coin-gecko-repository'
import { MoexRepository } from '@/repositories/moex-repository'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import type { ExchangeRate, SourceName } from '@/entities/exchange-rate'

const rawDirectory = path.join(import.meta.dirname, '..', '..', 'raw_data')

/** Репозиторий, возвращающий реальные данные из tests/raw_data/. */
class MockBinanceRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'binance' as const
  private readonly realRepo = new BinanceRepository()
  private readonly raw: string

  constructor() {
    this.raw = JSON.stringify(JSON.parse(readFileSync(path.join(rawDirectory, 'binance', 'ticker_price.json'), 'utf8')))
  }

  parseRates(raw: string): ExchangeRate[] {
    return this.realRepo.parseRates(raw)
  }

  async fetchRates(): Promise<ExchangeRate[]> {
    await Promise.resolve()
    return this.realRepo.parseRates(this.raw)
  }
}

/** Репозиторий, возвращающий реальные данные из tests/raw_data/. */
class MockCoinGeckoRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'coingecko' as const
  private readonly realRepo = new CoinGeckoRepository()
  private readonly raw: string

  constructor() {
    this.raw = JSON.stringify(
      JSON.parse(readFileSync(path.join(rawDirectory, 'coingecko', 'exchange_rates.json'), 'utf8'))
    )
  }

  parseRates(raw: string): ExchangeRate[] {
    return this.realRepo.parseRates(raw)
  }

  async fetchRates(): Promise<ExchangeRate[]> {
    await Promise.resolve()
    return this.realRepo.parseRates(this.raw)
  }
}

/** Репозиторий, возвращающий реальные данные из tests/raw_data/. */
class MockBybitRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'bybit' as const
  private readonly realRepo = new BybitRepository()
  private readonly raw: string

  constructor() {
    this.raw = JSON.stringify(JSON.parse(readFileSync(path.join(rawDirectory, 'bybit', 'spot_tickers.json'), 'utf8')))
  }

  parseRates(raw: string): ExchangeRate[] {
    return this.realRepo.parseRates(raw)
  }

  async fetchRates(): Promise<ExchangeRate[]> {
    await Promise.resolve()
    return this.realRepo.parseRates(this.raw)
  }
}

/** Репозиторий, возвращающий реальные данные из tests/raw_data/. */
class MockMoexRepository implements FinanceApiRepositoryInterface {
  readonly sourceName = 'moex' as const
  private readonly realRepo = new MoexRepository()
  private readonly combined: string

  constructor() {
    const currenciesRaw = readFileSync(path.join(rawDirectory, 'moex', 'currencies.json'), 'utf8')
    const indexesRaw = readFileSync(path.join(rawDirectory, 'moex', 'indexes.json'), 'utf8')
    const sharesRaw = readFileSync(path.join(rawDirectory, 'moex', 'shares.json'), 'utf8')
    this.combined = MoexRepository.combineResponses(currenciesRaw, indexesRaw, sharesRaw)
  }

  parseRates(raw: string): ExchangeRate[] {
    return this.realRepo.parseRates(raw)
  }

  async fetchRates(): Promise<ExchangeRate[]> {
    await Promise.resolve()
    return this.realRepo.parseRates(this.combined)
  }
}

/**
 * Создаёт репозиторий-заглушку, который всегда кидает ошибку
 * с заданным сообщением в fetchRates().
 * Используется в тестах для проверки обработки сбоев источников.
 */
export function createErrorMockRepo(sourceName: SourceName, errorMessage: string): FinanceApiRepositoryInterface {
  return {
    sourceName,
    parseRates: () => [],
    fetchRates: () => Promise.reject(new Error(errorMessage)),
  }
}

/**
 * Создаёт массив мок-репозиториев, которые возвращают
 * реальные данные из tests/raw_data/ без сетевых запросов.
 *
 * Использует настоящий parseRates каждого репозитория.
 */
export function createMockFinanceRepos(): FinanceApiRepositoryInterface[] {
  return [
    new MockCoinGeckoRepository(),
    new MockBinanceRepository(),
    new MockBybitRepository(),
    new MockMoexRepository(),
  ]
}
