import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, warning } from 'ionicons/icons';

addIcons({ checkmarkCircle, closeCircle, warning });

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
