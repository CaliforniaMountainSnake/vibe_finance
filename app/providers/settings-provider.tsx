'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDatabase } from '@/app/providers/database-provider'

const DEFAULT_FONT_SIZE = 1.0625

type SettingsContextValue = {
  fontSize: number
  setFontSize: (value: number) => void
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

  return <SettingsContext.Provider value={{ fontSize, setFontSize }}>{children}</SettingsContext.Provider>
}
