'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  /** Current resolved theme (follows system) */
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): Theme {
  if (globalThis.window === undefined) return 'light'
  return globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

async function updateStatusBar(theme: Theme) {
  try {
    if (theme === 'dark') {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#1A1A1A' })
    } else {
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
    }
  } catch {
    // Not on a native device — ignore
  }
}

/**
 * ThemeProvider — automatically follows system (light/dark) via matchMedia.
 * Works in browser and in Capacitor WebView.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getSystemTheme)

  useEffect(() => {
    const mq = globalThis.window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event_: MediaQueryListEvent) => {
      setTheme(event_.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Apply dark class to <html> (Tailwind uses this)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Sync Capacitor status bar
  useEffect(() => {
    updateStatusBar(theme)
  }, [theme])

  // Fallback: listen for native theme-change events from Android onConfigurationChanged
  useEffect(() => {
    const handler = (event_: Event) => {
      const detail = (event_ as CustomEvent<{ theme: Theme }>).detail
      if (detail?.theme) setTheme(detail.theme)
    }
    globalThis.window.addEventListener('nativeThemeChange', handler)
    return () => globalThis.window.removeEventListener('nativeThemeChange', handler)
  }, [])

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
