import { createSelector } from '@ngrx/store';
import { accountDetailFeature } from './account-detail.reducer';

export const {
  selectAccount: selectAccountDetail,
  selectTransactions: selectAccountDetailTransactions,
  selectCurrentPage: selectAccountDetailCurrentPage,
  selectTotalPages: selectAccountDetailTotalPages,
  selectLoading: selectAccountDetailLoading,
  selectLoadingMore: selectAccountDetailLoadingMore,
  selectError: selectAccountDetailError,
} = accountDetailFeature;

export const selectAccountDetailIsLast = createSelector(
  accountDetailFeature.selectCurrentPage,
  accountDetailFeature.selectTotalPages,
  (currentPage, totalPages) => totalPages === 0 || currentPage >= totalPages - 1
);
