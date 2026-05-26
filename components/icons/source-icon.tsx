import type { SVGProps } from 'react'
import type { SourceName } from '@/entities/ExchangeRate'
import { BinanceIcon } from './binance-icon'
import { CoinGeckoIcon } from './coingecko-icon'
import { MoexIcon } from './moex-icon'

const iconMap: Record<SourceName, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  binance: BinanceIcon,
  coingecko: CoinGeckoIcon,
  moex: MoexIcon,
}

type SourceIconProps = SVGProps<SVGSVGElement> & {
  source: SourceName
}

export function SourceIcon({ source, ...svgProps }: SourceIconProps) {
  const Icon = iconMap[source]
  if (!Icon) return null
  return <Icon aria-label={source} {...svgProps} />
}
