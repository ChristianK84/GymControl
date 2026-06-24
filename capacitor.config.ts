import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymcontrol.app',
  appName: 'GymControl',
  webDir: 'dist/GymControl/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      autoDeletePrevious: true,
      autoDeleteFailed: true,
      appReadyTimeout: 10000,
    }
  }
};

export default config;
