import type { Metadata, Viewport } from 'next'
import { Nunito, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SettingsProvider } from '@/app/providers/settings-provider'
import { DatabaseProvider } from '@/app/providers/database-provider'
import './globals.css'

export const viewport: Viewport = {
  viewportFit: 'cover',
}

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin', 'cyrillic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Vibe Finance',
  description: 'Криптокошелёк с курсами валют',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased safe-top`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <DatabaseProvider>
            <SettingsProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </SettingsProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
