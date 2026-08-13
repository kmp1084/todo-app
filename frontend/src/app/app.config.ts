import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { routes } from './app.routes';

import { environment } from '../environments/environment';
import { TASK_STORE } from './services/task-store';
import { LocalTaskStore } from './services/local-task-store';
import { HttpTaskStore } from './services/http-task-store';
import { inject } from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';

import { RoutingTaskStore } from './services/routing-task-store';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: TASK_STORE,
      useFactory: () =>
        environment.useBackend ? inject(RoutingTaskStore) : inject(LocalTaskStore),
    },
  ]
};
    
