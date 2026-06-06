'use client'

import { useSettings } from '@/app/providers/settings-provider'
import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utilities'

function AppCard({ className, ...properties }: ComponentProps<typeof Card>) {
  const { cardsRectangularLarge, cardsRectangularSmall } = useSettings()

  return (
    <Card
      className={cn(
        cardsRectangularLarge && 'sm:rounded-none',
        cardsRectangularSmall && 'max-sm:rounded-none',
        className
      )}
      {...properties}
    />
  )
}

export { AppCard }
export { CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
