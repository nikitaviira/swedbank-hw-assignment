import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'accounts/:id',
    loadComponent: () => import('./pages/account-detail/account-detail.component').then(m => m.AccountDetailComponent),
  },
  {
    path: 'accounts/:accountId/transactions/:id',
    loadComponent: () => import('./pages/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent),
  },
];
