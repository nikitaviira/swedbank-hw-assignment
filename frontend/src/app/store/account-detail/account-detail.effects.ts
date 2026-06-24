import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, forkJoin, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AccountService } from '../../services/account.service';
import {
  loadAccountDetail, loadAccountDetailFailure, loadAccountDetailSuccess,
  loadMoreTransactions, loadMoreTransactionsFailure, loadMoreTransactionsSuccess,
} from './account-detail.actions';
import { accountDetailFeature } from './account-detail.reducer';

@Injectable()
export class AccountDetailEffects {
  private readonly actions$ = inject(Actions);
  private readonly accountService = inject(AccountService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  loadAccountDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAccountDetail),
      switchMap(({ id }) =>
        forkJoin({
          account: this.accountService.getAccount(id),
          page: this.accountService.getTransactions(id, 0),
        }).pipe(
          map(({ account, page }) =>
            loadAccountDetailSuccess({
              account,
              transactions: page.content,
              totalPages: page.totalPages,
            })
          ),
          catchError(error => of(loadAccountDetailFailure({ error: error.message })))
        )
      )
    )
  );

  navigateOnFailure$ = createEffect(
    () => this.actions$.pipe(
      ofType(loadAccountDetailFailure),
      tap(() => this.router.navigate(['/'], { state: { error: 'Account not found' } }))
    ),
    { dispatch: false }
  );

  loadMoreTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMoreTransactions),
      withLatestFrom(this.store.select(accountDetailFeature.selectCurrentPage)),
      switchMap(([{ accountId }, currentPage]) =>
        this.accountService.getTransactions(accountId, currentPage + 1).pipe(
          map(page =>
            loadMoreTransactionsSuccess({
              transactions: page.content,
              totalPages: page.totalPages,
              page: currentPage + 1,
            })
          ),
          catchError(error => of(loadMoreTransactionsFailure({ error: error.message })))
        )
      )
    )
  );
}
