import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

import { environment } from '../environments/environment';
import { TASK_STORE } from './services/task-store';
import { LocalTaskStore } from './services/local-task-store';
import { HttpTaskStore } from './services/http-task-store';
import { inject } from '@angular/core';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideHttpClient(),
    {
      provide: TASK_STORE,
      useFactory: () =>
        environment.useBackend ? inject(HttpTaskStore) : inject(LocalTaskStore),
    },
  ]
};
    
