import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HoldingsCard } from '@/app/_components/holdings-card'
import { DatabaseProvider } from '@/app/providers/database-provider'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { LocaleProvider } from '@/app/providers/locale-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createPopulatedRepo, clearRepo } from './helpers/populate-mock-repo'
import { TEST_LOCALE } from '@/tests/helpers/test-locale'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

let repo: DatabaseRepositoryInterface

/** Ожидаемые лейблы в порядке, заданном fixtures/holdings.json. */
const EXPECTED_LABELS = ['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка']

function renderCard(): void {
  render(
    <DatabaseProvider repo={repo}>
      <SettingsProvider>
        <LocaleProvider locale={TEST_LOCALE}>
          <TooltipProvider>
            <HoldingsCard />
          </TooltipProvider>
        </LocaleProvider>
      </SettingsProvider>
    </DatabaseProvider>
  )
}

describe('HoldingsCard — HoldingsTable', () => {
  afterEach(async () => {
    await clearRepo(repo)
  })

  /* ── empty state ─────────────────────── */

  it('показывает пустое состояние, если холдингов нет', async () => {
    repo = await createPopulatedRepo()

    // Удаляем все холдинги, оставляя курсы и настройки
    const holdings = await repo.getHoldings()
    for (const h of holdings) {
      await repo.removeHolding(h.id)
    }

    renderCard()

    await waitFor(() => {
      expect(screen.getByText('Нет сохранённых средств. Добавьте кнопкой справа вверху.')).toBeInTheDocument()
    })
  })

  /* ── default state ───────────────────── */

  it('отображает лейблы всех 5 холдингов из трёх источников', async () => {
    repo = await createPopulatedRepo()
    renderCard()

    await waitFor(() => {
      for (const label of EXPECTED_LABELS) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })
  })

  it('показывает итоговую валюту USDT', async () => {
    repo = await createPopulatedRepo()
    renderCard()

    await waitFor(() => {
      const usdtElements = screen.getAllByText('USDT')
      expect(usdtElements.length).toBeGreaterThan(0)
    })
  })

  it('рендерит 10 строк таблицы (5 холдингов × 2 строки на холдинг)', async () => {
    repo = await createPopulatedRepo()
    renderCard()

    await waitFor(() => {
      const tbody = document.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      if (!tbody) return
      const rows = tbody.querySelectorAll('tr')
      expect(rows).toHaveLength(10)
    })
  })

  it('отображает холдинги в порядке, заданном фикстурой (порядок = order)', async () => {
    repo = await createPopulatedRepo()
    renderCard()

    await waitFor(() => {
      const tbody = document.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      if (!tbody) return
      const allRows = tbody.querySelectorAll('tr')

      // Лейблы — на второй строке каждой пары (нечётные индексы: 1, 3, 5, 7, 9)
      const labelTexts: string[] = []
      for (let index = 0; index < allRows.length; index += 2) {
        const labelRow = allRows[index + 1]
        labelTexts.push(labelRow.textContent.trim())
      }

      expect(labelTexts).toEqual(EXPECTED_LABELS)
    })
  })
})
