import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { ExchangeRateProvider } from '@/app/providers/exchange-rate-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import { createMockFinanceRepos } from './helpers/create-mock-finance-repos'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import App from '@/app/page'

let repo: DatabaseRepositoryInterface

describe('App', () => {
  afterEach(async () => {
    await clearRepo(repo)
  })

  it('отображает три основных карточки', async () => {
    repo = await createPopulatedRepo()

    render(
      <DatabaseProvider repo={repo}>
        <ExchangeRateProvider repos={createMockFinanceRepos()}>
          <SettingsProvider>
            <LocaleProvider locale={TEST_LOCALE}>
              <TooltipProvider>
                <App />
              </TooltipProvider>
            </LocaleProvider>
          </SettingsProvider>
        </ExchangeRateProvider>
      </DatabaseProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Данные API')).toBeInTheDocument()
      expect(screen.getByText('Избранные курсы')).toBeInTheDocument()
      expect(screen.getByText('Мои средства')).toBeInTheDocument()
    })
  })
})
