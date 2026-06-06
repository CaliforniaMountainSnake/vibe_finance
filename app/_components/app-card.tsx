'use client'

import { useSettings } from '@/app/providers/settings-provider'
import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utilities'

function AppCard({ className, ...properties }: ComponentProps<typeof Card>) {
  const { cardsRectangular } = useSettings()

  return <Card className={cn(cardsRectangular ? 'rounded-none' : undefined, className)} {...properties} />
}

export { AppCard }
export { CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
