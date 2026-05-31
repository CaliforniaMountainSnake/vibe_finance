import type { SVGProps } from 'react'
import type { SourceName } from '@/entities/exchange-rate'
import { BinanceIcon } from './binance-icon'
import { CoinGeckoIcon } from './coingecko-icon'
import { MoexIcon } from './moex-icon'
import { sourceDisplayName } from '@/lib/source-display-name'

const iconMap: Record<SourceName, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  binance: BinanceIcon,
  coingecko: CoinGeckoIcon,
  moex: MoexIcon,
}

type SourceIconProperties = SVGProps<SVGSVGElement> & {
  source: SourceName
}

export function SourceIcon({ source, ...svgProperties }: SourceIconProperties) {
  const Icon = iconMap[source]
  return Icon ? <Icon aria-label={sourceDisplayName(source)} {...svgProperties} /> : undefined
}
