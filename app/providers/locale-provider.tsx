'use client'

import { createContext, useContext } from 'react'

const LocaleContext = createContext<string | undefined>(undefined)

export function useLocale(): string {
  const locale = useContext(LocaleContext)
  if (locale === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return locale
}

export function LocaleProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
