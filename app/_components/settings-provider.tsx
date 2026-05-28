'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { dbRepo } from '@/lib/db'

const DEFAULT_FONT_SIZE = 1.0625

type SettingsContextValue = {
  fontSize: number
  setFontSize: (value: number) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (ctx === null) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return ctx
}

function applyFontSize(value: number): void {
  document.documentElement.style.setProperty('--font-size-scale', String(value))
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE)

  useEffect(() => {
    void dbRepo.getSetting('fontSize').then((stored) => {
      const value = stored ?? DEFAULT_FONT_SIZE
      setFontSizeState(value)
      applyFontSize(value)
    })
  }, [])

  const setFontSize = useCallback((value: number) => {
    setFontSizeState(value)
    applyFontSize(value)
    void dbRepo.setSetting('fontSize', value)
  }, [])

  return <SettingsContext.Provider value={{ fontSize, setFontSize }}>{children}</SettingsContext.Provider>
}
