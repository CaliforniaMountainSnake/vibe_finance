import type { ReactElement } from 'react'
import { afterEach } from 'vitest'
import { render, type RenderResult } from '@testing-library/react'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { ExchangeRateProvider } from '@/app/providers/exchange-rate-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { createPopulatedRepo, createEmptyRepo } from './populate-mock-repo'
import { createMockFinanceRepos } from './create-mock-finance-repos'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'

// ---------------------------------------------------------------------------
// Гарантированная очистка после каждого теста
// ---------------------------------------------------------------------------

let currentRepo: DatabaseRepositoryInterface | undefined

afterEach(async () => {
  if (currentRepo) {
    await currentRepo.clearAll()
    currentRepo = undefined
  }
})

// ---------------------------------------------------------------------------
// Единый провайдер со всеми контекстами, зеркалит app/layout.tsx
// ---------------------------------------------------------------------------

function AllProviders({ repo, children }: { repo: DatabaseRepositoryInterface; children: React.ReactNode }) {
  return (
    <DatabaseProvider repo={repo}>
      <ExchangeRateProvider repos={createMockFinanceRepos()}>
        <SettingsProvider>
          <LocaleProvider locale={TEST_LOCALE}>
            <TooltipProvider>{children}</TooltipProvider>
          </LocaleProvider>
        </SettingsProvider>
      </ExchangeRateProvider>
    </DatabaseProvider>
  )
}

// ---------------------------------------------------------------------------
// makeRenderer
// ---------------------------------------------------------------------------

/**
 * Создаёт свежий репозиторий и возвращает функцию рендера, привязанную к нему.
 * Каждый вызов — отдельная БД.
 *
 * @param populateDatabase  true → createPopulatedRepo (фикстуры),
 *                          false → createEmptyRepo.
 *                          По умолчанию true.
 */
export async function makeRenderer(populateDatabase = true): Promise<{
  render: (ui: ReactElement) => RenderResult
  repo: DatabaseRepositoryInterface
}> {
  const repo = populateDatabase ? await createPopulatedRepo() : createEmptyRepo()
  currentRepo = repo

  return {
    repo,
    render: (ui: ReactElement) => {
      return render(<AllProviders repo={repo}>{ui}</AllProviders>)
    },
  }
}
