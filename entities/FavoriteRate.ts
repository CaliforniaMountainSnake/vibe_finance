import { type TickerPair } from './TickerPair'

export type FavoriteRate = TickerPair & {
  addedAt: number // unix timestamp
}
