import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HoldingsCard } from '@/app/_components/holdings-card'
import { makeRenderer } from './helpers'

/** Извлечь порядок лейблов холдингов из <tbody>. */
function getLabelOrder(): string[] {
  const tbody = document.querySelector('tbody')
  if (!tbody) return []
  const rows = tbody.querySelectorAll('tr')
  const labels: string[] = []
  for (let index = 0; index < rows.length; index += 2) {
    const labelRow = rows[index + 1]
    labels.push(labelRow.textContent.trim())
  }
  return labels
}

async function expectOrder(labels: string[]): Promise<void> {
  await waitFor(() => {
    expect(getLabelOrder()).toEqual(labels)
  })
}

describe('HoldingsCard — таблица холдингов', () => {
  /* ── empty state ─────────────────────── */

  it('показывает пустое состояние, если холдингов нет', async () => {
    const { render, databaseRepo } = await makeRenderer()

    // Удаляем все холдинги, оставляя курсы и настройки
    const holdings = await databaseRepo.getHoldings()
    for (const h of holdings) {
      await databaseRepo.removeHolding(h.id)
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
      for (const label of ['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка']) {
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

      expect(labelTexts).toEqual(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка'])
    })
  })

  /* ── перестановка строк ─────────────── */

  it('перемещает первый холдинг вниз по нажатию "Переместить вниз"', async () => {
    const user = userEvent.setup()
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await expectOrder(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка'])
    await user.click(screen.getAllByRole('button', { name: 'Переместить вниз' })[0])
    await expectOrder(['Стейкинг', 'Холодный кошелёк', 'Банковский счёт', 'Наличные', 'Копилка'])
  })

  it('перемещает последний холдинг вверх по нажатию "Переместить вверх"', async () => {
    const user = userEvent.setup()
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await expectOrder(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка'])
    await user.click(screen.getAllByRole('button', { name: 'Переместить вверх' })[4])
    await expectOrder(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Копилка', 'Наличные'])
  })

  it('блокирует кнопку "Переместить вверх" у первого холдинга', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Переместить вверх' })[0]).toBeDisabled()
    })
  })

  it('блокирует кнопку "Переместить вниз" у последнего холдинга', async () => {
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Переместить вниз' })[4]).toBeDisabled()
    })
  })

  it('выполняет последовательность перестановок: вниз → вниз → исходный порядок', async () => {
    const user = userEvent.setup()
    const { render } = await makeRenderer()
    render(<HoldingsCard />)

    await expectOrder(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка'])

    // Первый — вниз
    await user.click(screen.getAllByRole('button', { name: 'Переместить вниз' })[0])
    await expectOrder(['Стейкинг', 'Холодный кошелёк', 'Банковский счёт', 'Наличные', 'Копилка'])

    // Бывший второй (теперь первый) — вниз → возвращаем исходный порядок
    await user.click(screen.getAllByRole('button', { name: 'Переместить вниз' })[0])
    await expectOrder(['Холодный кошелёк', 'Стейкинг', 'Банковский счёт', 'Наличные', 'Копилка'])
  })
})
