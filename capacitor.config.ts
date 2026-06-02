// Run `npx cap add android` to generate the android/ folder (it is git-ignored).
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.midnightcartographer.game',
  appName: 'The Midnight Cartographer',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#1a0e05' },
  plugins: {
    StatusBar: { style: 'Dark', backgroundColor: '#1a0e05' },
  },
};

export default config;
