import {
  ApplicationConfig,
  EnvironmentProviders,
  provideBrowserGlobalErrorListeners, Provider,
  provideZoneChangeDetection
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideNativeDateAdapter} from '@angular/material/core';
import {provideToastr} from 'ngx-toastr';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient} from '@angular/common/http';
import {tokenInterceptor} from './TokenInterceptor';
import { provideAuth } from './core/auth/auth.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideAnimations(),
    provideToastr(),
    provideHttpClient(),
  
    provideAuth(),
  ]
};
