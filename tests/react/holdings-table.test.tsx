import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { HoldingsCard } from '@/app/_components/holdings-card'
import { makeRenderer } from './helpers'

/** Ожидаемые лейблы в порядке, заданном fixtures/holdings.json. */
const EXPECTED_LABELS = ['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка']

describe('HoldingsCard — HoldingsTable', () => {
  /* ── empty state ─────────────────────── */

  it('показывает пустое состояние, если холдингов нет', async () => {
    const { render, repo } = await makeRenderer()

    // Удаляем все холдинги, оставляя курсы и настройки
    const holdings = await repo.getHoldings()
    for (const h of holdings) {
      await repo.removeHolding(h.id)
    }

    render(<HoldingsCard />)

    await waitFor(() => {
      expect(screen.getByText('Нет сохранённых средств. Добавьте кнопкой справа вверху.')).toBeInTheDocument()
    })
  })

  /* ── default state ───────────────────── */

  it('отображает лейблы всех 5 холдингов из трёх источников', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await waitFor(() => {
      for (const label of EXPECTED_LABELS) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })
  })

  it('показывает итоговую валюту USDT', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await waitFor(() => {
      const usdtElements = screen.getAllByText('USDT')
      expect(usdtElements.length).toBeGreaterThan(0)
    })
  })

  it('рендерит 10 строк таблицы (5 холдингов × 2 строки на холдинг)', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await waitFor(() => {
      const tbody = document.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      if (!tbody) return
      const rows = tbody.querySelectorAll('tr')
      expect(rows).toHaveLength(10)
    })
  })

  it('отображает холдинги в порядке, заданном фикстурой (порядок = order)', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

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
