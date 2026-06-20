'use client'

import { useRef } from 'react'
import { useDatabase } from '@/app/providers/database-provider'
import { useBackup } from '@/app/_hooks/use-backup'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Download, Loader2, Upload } from 'lucide-react'

export function BackupControls({ onRestored }: { onRestored?: () => void }) {
  const database = useDatabase()
  const { busy, progress, error, success, doExport, doImport } = useBackup(database, onRestored)
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
            void doExport()
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
              void doImport(file)
            }
            event_.target.value = ''
          }}
        />
      </div>
      {isBusy && <Progress value={progress} className="w-full" />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
    </div>
  )
}
