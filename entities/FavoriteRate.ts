import { type TickerPair } from './TickerPair'

export type FavoriteRate = TickerPair & {
  /** Уникальный идентификатор: "source1:ticker1->source2:ticker2" */
  id: string
  /** Порядковый номер в списке (0 — первый). */
  order: number
}
