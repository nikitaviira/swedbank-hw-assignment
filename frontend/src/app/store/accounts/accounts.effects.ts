import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { loadAccounts, loadAccountsFailure, loadAccountsSuccess } from './accounts.actions';

@Injectable()
export class AccountsEffects {
  private readonly actions$ = inject(Actions);
  private readonly accountService = inject(AccountService);

  loadAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAccounts),
      switchMap(() =>
        this.accountService.getAccounts().pipe(
          map(accounts => loadAccountsSuccess({ accounts })),
          catchError(error => of(loadAccountsFailure({ error: error.message })))
        )
      )
    )
  );
}
