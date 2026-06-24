import { createFeature, createReducer, on } from '@ngrx/store';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import {
  loadAccountDetail, loadAccountDetailFailure, loadAccountDetailSuccess,
  loadMoreTransactions, loadMoreTransactionsFailure, loadMoreTransactionsSuccess,
} from './account-detail.actions';

export interface AccountDetailState {
  account: Account | null;
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const initialState: AccountDetailState = {
  account: null,
  transactions: [],
  currentPage: 0,
  totalPages: 0,
  loading: false,
  loadingMore: false,
  error: null,
};

export const accountDetailFeature = createFeature({
  name: 'accountDetail',
  reducer: createReducer(
    initialState,
    on(loadAccountDetail, () => ({ ...initialState, loading: true })),
    on(loadAccountDetailSuccess, (_, { account, transactions, totalPages }) => ({
      ...initialState,
      account,
      transactions,
      currentPage: 0,
      totalPages,
    })),
    on(loadAccountDetailFailure, (_, { error }) => ({ ...initialState, error })),
    on(loadMoreTransactions, state => ({ ...state, loadingMore: true })),
    on(loadMoreTransactionsSuccess, (state, { transactions, totalPages, page }) => ({
      ...state,
      transactions: [...state.transactions, ...transactions],
      currentPage: page,
      totalPages,
      loadingMore: false,
    })),
    on(loadMoreTransactionsFailure, (state, { error }) => ({ ...state, error, loadingMore: false })),
  ),
});
