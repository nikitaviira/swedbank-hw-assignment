import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectSelectedTransaction } from '../../store/account-detail/account-detail.selectors';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="nav">
        <a [routerLink]="['/accounts', accountId]" class="back-link">← Account</a>
      </div>

      @if (transaction(); as tx) {
        <div class="detail-card">
          <div class="card-header">
            <div class="tx-icon" [class]="'tx-icon--' + tx.type.toLowerCase()">
              {{ tx.type === 'DEBIT' ? '−' : '+' }}
            </div>
            <div>
              <h1 class="tx-desc">{{ tx.description }}</h1>
              <span class="tx-date">{{ tx.createdAt | date: 'dd MMM yyyy, HH:mm' }}</span>
            </div>
          </div>

          <div class="fields">
            <div class="field">
              <span class="field-label">Type</span>
              <span class="field-value">{{ tx.type }}</span>
            </div>
            <div class="field">
              <span class="field-label">Amount</span>
              <span class="field-value" [class]="'amount--' + tx.type.toLowerCase()">
                {{ tx.type === 'DEBIT' ? '−' : '+' }}{{ tx.amount | number: '1.2-2' }}
              </span>
            </div>
            <div class="field">
              <span class="field-label">Balance After</span>
              <span class="field-value">{{ tx.balanceAfter | number: '1.2-2' }}</span>
            </div>
            <div class="field">
              <span class="field-label">Transaction ID</span>
              <span class="field-value mono">#{{ tx.id }}</span>
            </div>
          </div>

          <a class="export-btn" [href]="pdfUrl()" target="_blank">Export as PDF</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }

    .nav {
      margin-bottom: 2rem;
    }

    .back-link {
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.15s;
    }

    .back-link:hover { color: #ffffff; }

    .detail-card {
      background: #1e2330;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tx-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      font-size: 1.25rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .tx-icon--credit   { background: rgba(52,199,89,0.12);   color: #34c759; }
    .tx-icon--debit    { background: rgba(248,113,113,0.12); color: #f87171; }
    .tx-icon--exchange { background: rgba(79,99,216,0.12);   color: #6c7ee1; }

    .tx-desc {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.25rem;
    }

    .tx-date {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .fields {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .field:last-child { border-bottom: none; }

    .field-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .field-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #ffffff;
    }

    .field-value.mono {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.875rem;
    }

    .amount--credit   { color: #34c759; }
    .amount--debit    { color: #f87171; }
    .amount--exchange { color: #6c7ee1; }

    .export-btn {
      align-self: flex-start;
      padding: 0.625rem 1.25rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s;
    }

    .export-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.2);
    }
  `],
})
export class TransactionDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  accountId!: number;

  transaction = toSignal(this.store.select(selectSelectedTransaction));
  pdfUrl = computed(() => `/api/transactions/${this.transaction()?.id}/pdf`);

  ngOnInit(): void {
    this.accountId = +this.route.snapshot.paramMap.get('accountId')!;
    if (!this.transaction()) {
      this.router.navigate(['/']);
    }
  }
}
