import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vibeapp.finance',
  appName: 'Vibe Finance',
  webDir: 'out',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
}

export default config
