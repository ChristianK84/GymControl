import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymcontrol.app',
  appName: 'GymControl',
  webDir: 'dist/GymControl/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
