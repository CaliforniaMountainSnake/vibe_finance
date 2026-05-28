'use client'

import { useSettings } from './settings-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Minus, Plus, Settings, X } from 'lucide-react'

const FONT_SIZE_SMALL = 0.875
const FONT_SIZE_DEFAULT = 1
const FONT_SIZE_COMFORTABLE = 1.0625
const FONT_SIZE_LARGE = 1.125
const FONT_SIZE_XLARGE = 1.25

const FONT_SIZE_STEPS = [FONT_SIZE_SMALL, FONT_SIZE_DEFAULT, FONT_SIZE_COMFORTABLE, FONT_SIZE_LARGE, FONT_SIZE_XLARGE]

function fontSizeToStep(value: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < FONT_SIZE_STEPS.length; i++) {
    const dist = Math.abs(FONT_SIZE_STEPS[i] - value)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

const FONT_SIZE_LABELS = ['Очень маленький', 'Маленький', 'Средний', 'Большой', 'Очень большой'] as const

function fontSizeLabel(step: number): string {
  return FONT_SIZE_LABELS[step] ?? 'Средний'
}

export function SettingsDialog() {
  const { fontSize, setFontSize } = useSettings()
  const currentStep = fontSizeToStep(fontSize)

  function handleValueChange([v]: number[]) {
    const step = Math.round(v)
    setFontSize(FONT_SIZE_STEPS[step])
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Настройки">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>Настройте приложение под себя</DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="size-4" />
            <span className="sr-only">Закрыть</span>
          </DialogClose>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Размер шрифта</span>
            <span className="text-xs text-muted-foreground">{fontSizeLabel(currentStep)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Уменьшить размер шрифта"
              disabled={currentStep === 0}
              onClick={() => setFontSize(FONT_SIZE_STEPS[currentStep - 1])}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground shrink-0">А</span>
            <Slider
              value={[currentStep]}
              onValueChange={handleValueChange}
              min={0}
              max={FONT_SIZE_STEPS.length - 1}
              step={1}
              aria-label="Размер шрифта"
            />
            <span className="text-base text-muted-foreground shrink-0">А</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Увеличить размер шрифта"
              disabled={currentStep === FONT_SIZE_STEPS.length - 1}
              onClick={() => setFontSize(FONT_SIZE_STEPS[currentStep + 1])}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
