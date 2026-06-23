import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routes } from './app.routes';
import { accountsFeature } from './store/accounts/accounts.reducer';
import { AccountsEffects } from './store/accounts/accounts.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideStore({ [accountsFeature.name]: accountsFeature.reducer }),
    provideEffects([AccountsEffects]),
  ],
};
