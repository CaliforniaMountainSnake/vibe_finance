import type { SVGProps } from 'react'

export function CoinGeckoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1011" {...props}>
      <defs>
        {/* Coin circle punched out as a transparent hole in the body */}
        <mask id="cg-cutout">
          <rect width="1000" height="1011" fill="white" />
          <path
            d="M525.774 379.88C525.774 433.675 482.475 477.246 429.101 477.246C375.726 477.246 332.428 433.675 332.428 379.88C332.428 326.085 375.726 282.553 429.101 282.553C482.475 282.553 525.774 326.123 525.774 379.88Z"
            fill="black"
          />
          {/* Small triangle cutout on the coin */}
          <path d="M469.849 379.205L401.774 333.822V424.588L469.849 379.205Z" fill="black" />
        </mask>
        <clipPath id="cg-clip">
          <rect width="1000" height="1010.61" fill="white" transform="translate(0 0.38739)" />
        </clipPath>
      </defs>
      <g clipPath="url(#cg-clip)">
        {/* Outer circle — lighter via opacity */}
        <path
          d="M999.995 501.717C1001.24 779.849 778.389 1006.32 502.273 1007.58C226.118 1008.84 1.25532 784.39 0.00523352 506.257C-1.24485 228.125 221.611 1.65138 497.765 0.392348C773.882 -0.828534 998.745 223.585 999.995 501.717Z"
          fill="currentColor"
          fillOpacity={0.25}
        />
        {/* Body with coin cutout */}
        <g mask="url(#cg-cutout)">
          {/* Main body */}
          <path
            d="M753.592 323.781C717.301 313.213 679.723 298.181 641.615 283.034C639.418 273.42 630.97 261.44 613.848 246.751C588.96 225.004 542.214 225.576 501.833 235.191C457.247 224.623 413.191 220.845 370.915 231.07C25.211 327.024 221.209 561.014 94.2686 796.301C112.338 834.873 311.629 1020.19 588.695 999.616C588.695 999.616 492.363 766.466 709.763 654.526C886.1 563.761 1013.5 395.203 753.554 323.743L753.592 323.781Z"
            fill="currentColor"
          />
          {/* Lower body */}
          <path
            d="M874.561 520.005C796.261 575.593 707.126 617.752 580.792 617.752C521.66 617.752 509.651 554.457 470.558 585.475C450.367 601.499 379.226 637.324 322.745 634.615C265.772 631.868 174.819 598.523 149.249 477.16C139.135 598.523 133.983 687.953 88.7148 790.431C199.838 953.745 393.589 1035 588.672 999.659C567.723 852.276 695.61 707.945 767.66 634.081C794.935 606.115 847.211 560.447 874.561 520.005Z"
            fill="currentColor"
          />
          {/* Top head */}
          <path
            d="M492.523 235.006C523.475 247.377 636.5 285.022 685.401 299.799C635.472 216.953 559.808 221.734 492.523 235.006Z"
            fill="currentColor"
            fillOpacity={0.85}
          />
        </g>
        {/* Eye — sits in the transparent cutout, visible against page background */}
        <ellipse cx="469.845" cy="379.216" rx="56.7287" ry="79.4202" fill="currentColor" />
      </g>
    </svg>
  )
}
