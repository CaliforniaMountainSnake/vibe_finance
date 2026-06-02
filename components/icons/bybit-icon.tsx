import type { SVGProps } from 'react'

export function BybitIcon(properties: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...properties}>
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M7.5 16.5V7.5h3.75a3 3 0 0 1 0 6H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M11.25 13.5 14 16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
