'use client'

import { useState } from 'react'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'

const PROGRESS_MAX = 100

export interface UseBackupReturn {
  busy: 'idle' | 'exporting' | 'importing'
  progress: number
  error?: string
  success?: string
  doExport: () => Promise<void>
  doImport: (file: File) => Promise<void>
}

export function useBackup(database: DatabaseRepositoryInterface, onRestored?: () => void): UseBackupReturn {
  const [busy, setBusy] = useState<'idle' | 'exporting' | 'importing'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()

  const doExport: () => Promise<void> = async () => {
    setBusy('exporting')
    setProgress(0)
    setError(undefined)
    try {
      const blob = await database.exportBackup((p) => {
        let pct = 0
        if (p.totalRows) {
          pct = Math.round((p.completedRows / p.totalRows) * PROGRESS_MAX)
        } else if (p.completedTables > 0) {
          pct = Math.round((p.completedTables / p.totalTables) * PROGRESS_MAX)
        }
        setProgress(pct)
        return true
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `vibe-finance-${new Date().toISOString().split('T')[0]}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Ошибка при создании резервной копии')
    } finally {
      setBusy('idle')
    }
  }

  const doImport: (file: File) => Promise<void> = async (file) => {
    setBusy('importing')
    setProgress(0)
    setError(undefined)
    setSuccess(undefined)
    try {
      await database.importBackup(file, (p) => {
        let pct = 0
        if (p.totalRows) {
          pct = Math.round((p.completedRows / p.totalRows) * PROGRESS_MAX)
        } else if (p.completedTables > 0) {
          pct = Math.round((p.completedTables / p.totalTables) * PROGRESS_MAX)
        }
        setProgress(pct)
        return true
      })
      setSuccess('Бекап восстановлен')
      onRestored?.()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Ошибка при восстановлении из резервной копии')
    } finally {
      setBusy('idle')
    }
  }

  return { busy, progress, error, success, doExport, doImport }
}
