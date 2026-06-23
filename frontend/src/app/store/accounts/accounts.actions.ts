import { createAction, props } from '@ngrx/store';
import { Account } from '../../models/account.model';

export const loadAccounts = createAction('[Accounts] Load Accounts');

export const loadAccountsSuccess = createAction(
  '[Accounts] Load Accounts Success',
  props<{ accounts: Account[] }>()
);

export const loadAccountsFailure = createAction(
  '[Accounts] Load Accounts Failure',
  props<{ error: string }>()
);
