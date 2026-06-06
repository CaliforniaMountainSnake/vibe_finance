'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDatabase } from '@/app/providers/database-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

const DEFAULT_FONT_SIZE = 1.0625
const DEFAULT_CARDS_RECTANGULAR_LARGE = false
const DEFAULT_CARDS_RECTANGULAR_SMALL = false
const DEFAULT_CARD_PADDING_REMOVED_LARGE = false
const DEFAULT_CARD_PADDING_REMOVED_SMALL = false
const DEFAULT_COMPACT_REFRESH_CARD = true

type BooleanSettingKey =
  | 'cardsRectangularLarge'
  | 'cardsRectangularSmall'
  | 'cardPaddingRemovedLarge'
  | 'cardPaddingRemovedSmall'
  | 'compactRefreshCard'

const DEFAULT_BY_KEY: Record<BooleanSettingKey, boolean> = {
  cardsRectangularLarge: DEFAULT_CARDS_RECTANGULAR_LARGE,
  cardsRectangularSmall: DEFAULT_CARDS_RECTANGULAR_SMALL,
  cardPaddingRemovedLarge: DEFAULT_CARD_PADDING_REMOVED_LARGE,
  cardPaddingRemovedSmall: DEFAULT_CARD_PADDING_REMOVED_SMALL,
  compactRefreshCard: DEFAULT_COMPACT_REFRESH_CARD,
}

function useBooleanSetting(
  key: BooleanSettingKey,
  databaseRepo: DatabaseRepositoryInterface
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(DEFAULT_BY_KEY[key])

  useEffect(() => {
    void databaseRepo.getSetting(key).then((stored) => {
      setValue(stored ?? DEFAULT_BY_KEY[key])
    })
  }, [databaseRepo, key])

  const set = useCallback(
    (newValue: boolean) => {
      setValue(newValue)
      void databaseRepo.setSetting(key, newValue)
    },
    [databaseRepo, key]
  )

  return [value, set]
}

type SettingsContextValue = {
  fontSize: number
  setFontSize: (value: number) => void
  cardsRectangularLarge: boolean
  setCardsRectangularLarge: (value: boolean) => void
  cardsRectangularSmall: boolean
  setCardsRectangularSmall: (value: boolean) => void
  cardPaddingRemovedLarge: boolean
  setCardPaddingRemovedLarge: (value: boolean) => void
  cardPaddingRemovedSmall: boolean
  setCardPaddingRemovedSmall: (value: boolean) => void
  compactRefreshCard: boolean
  setCompactRefreshCard: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

function applyFontSize(value: number): void {
  document.documentElement.style.setProperty('--font-size-scale', String(value))
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE)
  const databaseRepo = useDatabase()

  const [cardsRectangularLarge, setCardsRectangularLarge] = useBooleanSetting('cardsRectangularLarge', databaseRepo)
  const [cardsRectangularSmall, setCardsRectangularSmall] = useBooleanSetting('cardsRectangularSmall', databaseRepo)
  const [cardPaddingRemovedLarge, setCardPaddingRemovedLarge] = useBooleanSetting(
    'cardPaddingRemovedLarge',
    databaseRepo
  )
  const [cardPaddingRemovedSmall, setCardPaddingRemovedSmall] = useBooleanSetting(
    'cardPaddingRemovedSmall',
    databaseRepo
  )
  const [compactRefreshCard, setCompactRefreshCard] = useBooleanSetting('compactRefreshCard', databaseRepo)

  useEffect(() => {
    void databaseRepo.getSetting('fontSize').then((stored) => {
      const value = stored ?? DEFAULT_FONT_SIZE
      setFontSizeState(value)
      applyFontSize(value)
    })
  }, [databaseRepo])

  const setFontSize = useCallback(
    (value: number) => {
      setFontSizeState(value)
      applyFontSize(value)
      void databaseRepo.setSetting('fontSize', value)
    },
    [databaseRepo]
  )

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize,
        cardsRectangularLarge,
        setCardsRectangularLarge,
        cardsRectangularSmall,
        setCardsRectangularSmall,
        cardPaddingRemovedLarge,
        setCardPaddingRemovedLarge,
        cardPaddingRemovedSmall,
        setCardPaddingRemovedSmall,
        compactRefreshCard,
        setCompactRefreshCard,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
