'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDatabase } from '@/app/providers/database-provider'

const DEFAULT_FONT_SIZE = 1.0625
const DEFAULT_CARDS_RECTANGULAR = false
const DEFAULT_CARD_PADDING_REMOVED = false

type SettingsContextValue = {
  fontSize: number
  setFontSize: (value: number) => void
  cardsRectangular: boolean
  setCardsRectangular: (value: boolean) => void
  cardPaddingRemoved: boolean
  setCardPaddingRemoved: (value: boolean) => void
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
  const [cardsRectangular, setCardsRectangularState] = useState(DEFAULT_CARDS_RECTANGULAR)
  const [cardPaddingRemoved, setCardPaddingRemovedState] = useState(DEFAULT_CARD_PADDING_REMOVED)

  const databaseRepo = useDatabase()

  useEffect(() => {
    void databaseRepo.getSetting('fontSize').then((stored) => {
      const value = stored ?? DEFAULT_FONT_SIZE
      setFontSizeState(value)
      applyFontSize(value)
    })
    void databaseRepo.getSetting('cardsRectangular').then((stored) => {
      setCardsRectangularState(stored ?? DEFAULT_CARDS_RECTANGULAR)
    })
    void databaseRepo.getSetting('cardPaddingRemoved').then((stored) => {
      setCardPaddingRemovedState(stored ?? DEFAULT_CARD_PADDING_REMOVED)
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

  const setCardsRectangular = useCallback(
    (value: boolean) => {
      setCardsRectangularState(value)
      void databaseRepo.setSetting('cardsRectangular', value)
    },
    [databaseRepo]
  )

  const setCardPaddingRemoved = useCallback(
    (value: boolean) => {
      setCardPaddingRemovedState(value)
      void databaseRepo.setSetting('cardPaddingRemoved', value)
    },
    [databaseRepo]
  )

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize,
        cardsRectangular,
        setCardsRectangular,
        cardPaddingRemoved,
        setCardPaddingRemoved,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
