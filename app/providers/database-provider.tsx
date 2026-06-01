'use client'

import { createContext, useContext, useMemo } from 'react'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { DexieRepository } from '@/repositories/dexie-repository'

const DatabaseContext = createContext<DatabaseRepositoryInterface | undefined>(undefined)

export function DatabaseProvider({
  repo,
  children,
}: {
  repo?: DatabaseRepositoryInterface
  children: React.ReactNode
}) {
  const defaultRepo = useMemo(() => new DexieRepository(), [])
  return <DatabaseContext.Provider value={repo ?? defaultRepo}>{children}</DatabaseContext.Provider>
}

export function useDatabase(): DatabaseRepositoryInterface {
  const repo = useContext(DatabaseContext)
  if (!repo) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return repo
}
