import { createFeature, createReducer, on } from '@ngrx/store';
import { Account } from '../../models/account.model';
import { loadAccounts, loadAccountsFailure, loadAccountsSuccess } from './accounts.actions';

export interface AccountsState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  loading: false,
  error: null,
};

export const accountsFeature = createFeature({
  name: 'accounts',
  reducer: createReducer(
    initialState,
    on(loadAccounts, state => ({ ...state, loading: true, error: null })),
    on(loadAccountsSuccess, (state, { accounts }) => ({ ...state, accounts, loading: false })),
    on(loadAccountsFailure, (state, { error }) => ({ ...state, error, loading: false }))
  ),
});
