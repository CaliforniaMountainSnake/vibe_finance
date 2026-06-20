'use client'

import { useRef, useState } from 'react'
import { useDatabase } from '@/app/providers/database-provider'
import type { DatabaseRepositoryInterface } from '@/repositories/database-repository-interface'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, Loader2, Upload } from 'lucide-react'

const PROGRESS_MAX = 100

function onBackupProgress(
  current: { totalTables: number; completedTables: number; totalRows: number | undefined; completedRows: number },
  setProgress: (v: number) => void
): boolean {
  let pct = 0
  if (current.totalRows) {
    pct = Math.round((current.completedRows / current.totalRows) * PROGRESS_MAX)
  } else if (current.completedTables > 0) {
    pct = Math.round((current.completedTables / current.totalTables) * PROGRESS_MAX)
  }
  setProgress(pct)
  return true
}

async function doExport(
  database: DatabaseRepositoryInterface,
  setBusy: (state: 'idle' | 'exporting' | 'importing') => void,
  setProgress: (v: number) => void
): Promise<void> {
  setBusy('exporting')
  setProgress(0)
  try {
    const blob = await database.exportBackup({
      progressCallback: (p) => onBackupProgress(p, setProgress),
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `vibe-finance-${new Date().toISOString().split('T')[0]}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('Ошибка при создании резервной копии')
    // eslint-disable-next-line no-console
    console.error(error)
  } finally {
    setBusy('idle')
  }
}

async function doImport(
  file: File,
  controllers: {
    database: DatabaseRepositoryInterface
    setBusy: (state: 'idle' | 'exporting' | 'importing') => void
    setProgress: (v: number) => void
  }
): Promise<void> {
  controllers.setBusy('importing')
  controllers.setProgress(0)
  try {
    await controllers.database.importBackup(file, {
      clearTablesBeforeImport: true,
      progressCallback: (p) => onBackupProgress(p, controllers.setProgress),
    })
  } catch (error) {
    alert('Ошибка при восстановлении из резервной копии')
    // eslint-disable-next-line no-console
    console.error(error)
  } finally {
    controllers.setBusy('idle')
  }
}

export function BackupControls() {
  const database = useDatabase()
  const [busy, setBusy] = useState<'idle' | 'exporting' | 'importing'>('idle')
  const [progress, setProgress] = useState(0)
  const fileInputReference = useRef<HTMLInputElement>(null)
  const isBusy = busy !== 'idle'
  const exportIcon =
    busy === 'exporting' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />
  const importIcon =
    busy === 'importing' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Резервное копирование</p>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={isBusy}
          onClick={() => {
            void doExport(database, setBusy, setProgress)
          }}
        >
          {exportIcon}
          Создать резервную копию
        </Button>
        <Button
          variant="outline"
          disabled={isBusy}
          onClick={() => {
            fileInputReference.current?.click()
          }}
        >
          {importIcon}
          Восстановить из копии
        </Button>
        <input
          ref={fileInputReference}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(event_) => {
            const file = event_.target.files?.[0]
            if (file) {
              void doImport(file, { database, setBusy, setProgress })
            }
            event_.target.value = ''
          }}
        />
      </div>
      {isBusy && <Progress value={progress} className="w-full" />}
    </div>
  )
}
