import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vibeapp.skeleton',
  appName: 'vibe_app_skeleton',
  webDir: 'out',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
}

export default config
