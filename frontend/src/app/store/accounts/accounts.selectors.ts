import { accountsFeature } from './accounts.reducer';

export const {
  selectAccounts,
  selectLoading: selectAccountsLoading,
  selectError: selectAccountsError,
} = accountsFeature;
