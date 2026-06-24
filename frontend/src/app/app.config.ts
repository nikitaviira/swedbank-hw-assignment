import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routes } from './app.routes';
import { accountsFeature } from './store/accounts/accounts.reducer';
import { AccountsEffects } from './store/accounts/accounts.effects';
import { accountDetailFeature } from './store/account-detail/account-detail.reducer';
import { AccountDetailEffects } from './store/account-detail/account-detail.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideStore({
      [accountsFeature.name]: accountsFeature.reducer,
      [accountDetailFeature.name]: accountDetailFeature.reducer,
    }),
    provideEffects([AccountsEffects, AccountDetailEffects]),
  ],
};
