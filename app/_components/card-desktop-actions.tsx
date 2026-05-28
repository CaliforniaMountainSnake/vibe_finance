'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronUp, ChevronDown, Eye, EyeOff, Pencil, X } from 'lucide-react'

type CardDesktopActionsProps = {
  holdingId: string
  isFirst: boolean
  isLast: boolean
  disabled: boolean
  onEditClick: () => void
  onRemoveClick: () => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onToggleEnabled: (id: string) => void
}

function ActionBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button variant="ghost" size="icon-xs" aria-label={label} disabled={disabled} onClick={onClick}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

export function CardDesktopActions({
  holdingId,
  isFirst,
  isLast,
  disabled,
  onEditClick,
  onRemoveClick,
  onMoveUp,
  onMoveDown,
  onToggleEnabled,
}: CardDesktopActionsProps) {
  return (
    <div className="hidden md:flex items-center gap-0.5">
      <ActionBtn label="Редактировать" onClick={onEditClick}>
        <Pencil aria-hidden="true" className="size-3" />
      </ActionBtn>
      <ActionBtn label="Переместить вверх" disabled={isFirst} onClick={() => onMoveUp(holdingId)}>
        <ChevronUp aria-hidden="true" className="size-3" />
      </ActionBtn>
      <ActionBtn label="Переместить вниз" disabled={isLast} onClick={() => onMoveDown(holdingId)}>
        <ChevronDown aria-hidden="true" className="size-3" />
      </ActionBtn>
      <ActionBtn
        label={disabled ? 'Учитывать в итоге' : 'Не учитывать в итоге'}
        onClick={() => onToggleEnabled(holdingId)}
      >
        {disabled ? <Eye aria-hidden="true" className="size-3" /> : <EyeOff aria-hidden="true" className="size-3" />}
      </ActionBtn>
      <ActionBtn label="Удалить" onClick={onRemoveClick}>
        <X aria-hidden="true" className="size-3" />
      </ActionBtn>
    </div>
  )
}
