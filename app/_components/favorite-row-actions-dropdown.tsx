'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Ticker } from '@/entities/ticker'
import type { TickerPair } from '@/entities/ticker-pair'
import { ChevronUp, ChevronDown, EllipsisVertical, X } from 'lucide-react'

function tickerLabel(t: Ticker): string {
  return `${t.source}:${t.ticker.toUpperCase()}`
}

type FavoriteRowActionsDropdownProperties = {
  pair: TickerPair
  isFirst: boolean
  isLast: boolean
  onMoveUp: (pair: TickerPair) => void
  onMoveDown: (pair: TickerPair) => void
  onRemove: (pair: TickerPair) => void
}

export function FavoriteRowActionsDropdown({
  pair,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FavoriteRowActionsDropdownProperties) {
  const [removeOpen, setRemoveOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Действия для ${tickerLabel(pair.from)} → ${tickerLabel(pair.to)}`}
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isFirst}
            onClick={() => {
              onMoveUp(pair)
            }}
          >
            <ChevronUp aria-hidden="true" className="size-4" />
            Переместить вверх
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLast}
            onClick={() => {
              onMoveDown(pair)
            }}
          >
            <ChevronDown aria-hidden="true" className="size-4" />
            Переместить вниз
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setRemoveOpen(true)
            }}
          >
            <X aria-hidden="true" className="size-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить курс?</AlertDialogTitle>
            <AlertDialogDescription>
              {tickerLabel(pair.from)} → {tickerLabel(pair.to)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onRemove(pair)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
