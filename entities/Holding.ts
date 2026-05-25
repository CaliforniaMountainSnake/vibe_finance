import type { Ticker } from './Ticker'

export type Holding = {
  /** UUID v4 */
  id: string
  /** Валюта, в которой хранится сумма */
  ticker: Ticker
  /** Количество средств в этой валюте */
  amount: number
  /** Пользовательское название, например "Карточка синего банка" */
  label: string
  /** Порядковый номер в списке (0 — первый) */
  order: number
  /** Учитывается ли строка в подсчёте общей суммы */
  enabled: boolean
}

/**
 * Поля холдинга, которые можно обновить через updateHolding().
 * Все поля опциональны — передаются только те, что нужно изменить.
 */
export type HoldingUpdate = {
  ticker?: Ticker
  amount?: number
  label?: string
  enabled?: boolean
}
