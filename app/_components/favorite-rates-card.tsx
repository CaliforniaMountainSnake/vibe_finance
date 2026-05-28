'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExchangeRate } from '@/entities/ExchangeRate'
import type { TickerPair } from '@/entities/TickerPair'
import { AddFavoritesDialog } from './add-favorites-dropdown'
import { CurrencySearchProvider } from './currency-search-provider'
import { FavoritesTable, pairId } from './favorite-rates-table'
import { dbRepo } from '@/lib/db'

/* ── FavoriteRatesCard ────────────────────────────────────────── */

type FavoriteRatesCardProps = {
  refreshKey?: number
}

export function FavoriteRatesCard({ refreshKey }: FavoriteRatesCardProps) {
  const [favorites, setFavorites] = useState<TickerPair[]>([])
  const [allRates, setAllRates] = useState<ExchangeRate[]>([])
  const [rates, setRates] = useState<Record<string, number>>({})

  const loadFavorites = useCallback(async () => {
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  useEffect(() => {
    void (async () => {
      const [fav, all] = await Promise.all([dbRepo.getFavoriteRates(), dbRepo.getAllRates()])
      setFavorites(fav)
      setAllRates(all)
    })()
  }, [refreshKey])

  useEffect(() => {
    const compute = async () => {
      const map: Record<string, number> = {}
      for (const pair of favorites) {
        const id = pairId(pair.from, pair.to)
        try {
          map[id] = await dbRepo.getRate(pair)
        } catch {
          /* rate unavailable */
        }
      }
      setRates(map)
    }
    void compute()
  }, [favorites])

  const handleRemove = useCallback(async (pair: TickerPair) => {
    await dbRepo.removeFavoriteRate(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  const handleMoveUp = useCallback(async (pair: TickerPair) => {
    await dbRepo.moveFavoriteRateUp(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  const handleMoveDown = useCallback(async (pair: TickerPair) => {
    await dbRepo.moveFavoriteRateDown(pair)
    const fav = await dbRepo.getFavoriteRates()
    setFavorites(fav)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Избранные курсы</CardTitle>
        <CardAction>
          <CurrencySearchProvider allRates={allRates}>
            <AddFavoritesDialog allRates={allRates} onAdded={loadFavorites} />
          </CurrencySearchProvider>
        </CardAction>
      </CardHeader>
      <CardFooter className="block p-0">
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет избранных курсов. Добавьте пару кнопкой справа вверху.
          </p>
        ) : (
          <FavoritesTable
            favorites={favorites}
            rates={rates}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        )}
      </CardFooter>
    </Card>
  )
}
