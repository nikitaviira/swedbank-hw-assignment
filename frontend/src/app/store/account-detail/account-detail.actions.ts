import { createAction, props } from '@ngrx/store';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';

export const loadAccountDetail = createAction('[Account Detail] Load', props<{ id: number }>());
export const loadAccountDetailSuccess = createAction(
  '[Account Detail] Load Success',
  props<{ account: Account; transactions: Transaction[]; totalPages: number }>()
);
export const loadAccountDetailFailure = createAction(
  '[Account Detail] Load Failure',
  props<{ error: string }>()
);

export const loadMoreTransactions = createAction(
  '[Account Detail] Load More Transactions',
  props<{ accountId: number }>()
);
export const loadMoreTransactionsSuccess = createAction(
  '[Account Detail] Load More Transactions Success',
  props<{ transactions: Transaction[]; totalPages: number; page: number }>()
);
export const loadMoreTransactionsFailure = createAction(
  '[Account Detail] Load More Transactions Failure',
  props<{ error: string }>()
);
