import type { ReactElement } from 'react'
import { afterEach } from 'vitest'
import { render, type RenderResult } from '@testing-library/react'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { ExchangeRateProvider } from '@/app/providers/exchange-rate-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import type { FinanceApiRepositoryInterface } from '@/repositories/finance-api-repository-interface'
import { createPopulatedRepo, createEmptyRepo } from './populate-mock-repo'
import { createMockFinanceRepos } from './create-mock-finance-repos'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'

// ---------------------------------------------------------------------------
// Гарантированная очистка после каждого теста
// ---------------------------------------------------------------------------

const allDatabaseRepos = new Set<DatabaseRepositoryInterface>()

afterEach(async () => {
  for (const databaseRepo of allDatabaseRepos) {
    await databaseRepo.clearAll()
  }
  allDatabaseRepos.clear()
})

// ---------------------------------------------------------------------------
// Единый провайдер со всеми контекстами, зеркалит app/layout.tsx
// ---------------------------------------------------------------------------

function AllProviders({
  databaseRepo,
  financeRepos,
  children,
}: {
  databaseRepo: DatabaseRepositoryInterface
  financeRepos: FinanceApiRepositoryInterface[]
  children: React.ReactNode
}) {
  return (
    <DatabaseProvider repo={databaseRepo}>
      <ExchangeRateProvider repos={financeRepos}>
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
 * @param financeRepos      Опциональный массив репозиториев API.
 *                          Если не передан, используются createMockFinanceRepos().
 */
export async function makeRenderer(
  populateDatabase = true,
  financeRepos?: FinanceApiRepositoryInterface[]
): Promise<{
  render: (ui: ReactElement) => RenderResult
  databaseRepo: DatabaseRepositoryInterface
}> {
  const databaseRepo = populateDatabase ? await createPopulatedRepo() : createEmptyRepo()
  const resolvedFinanceRepos = financeRepos ?? createMockFinanceRepos()
  allDatabaseRepos.add(databaseRepo)

  return {
    databaseRepo,
    render: (ui: ReactElement) => {
      return render(
        <AllProviders databaseRepo={databaseRepo} financeRepos={resolvedFinanceRepos}>
          {ui}
        </AllProviders>
      )
    },
  }
}
