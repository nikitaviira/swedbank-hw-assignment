import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TransactionDetailComponent } from './transaction-detail.component';
import { Transaction } from '../../models/transaction.model';

const mockTx: Transaction = {
  id: 42,
  accountId: 1,
  amount: 150.75,
  type: 'CREDIT',
  description: 'Salary',
  balanceAfter: 1500.00,
  createdAt: '2024-03-15T09:30:00',
};

const stateWith = (tx: Transaction | null) => ({
  accountDetail: {
    account: null, transactions: [], currentPage: 0, totalPages: 0,
    loading: false, loadingMore: false, error: null,
    selectedTransaction: tx,
  },
});

describe('TransactionDetailComponent', () => {
  let fixture: ComponentFixture<TransactionDetailComponent>;
  let store: MockStore;
  let router: Router;

  const setup = async (tx: Transaction | null) => {
    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent],
      providers: [
        provideRouter([{ path: '', component: TransactionDetailComponent }]),
        provideMockStore({ initialState: stateWith(tx) }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ accountId: '1', id: '42' }) } },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
  };

  afterEach(() => vi.clearAllMocks());

  describe('with a transaction in store', () => {
    beforeEach(async () => setup(mockTx));

    it('should create', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the detail card', () => {
      expect(fixture.nativeElement.querySelector('.detail-card')).toBeTruthy();
    });

    it('should display the transaction description', () => {
      expect(fixture.nativeElement.textContent).toContain('Salary');
    });

    it('should display the transaction type', () => {
      expect(fixture.nativeElement.textContent).toContain('CREDIT');
    });

    it('should display the amount with + prefix for CREDIT', () => {
      expect(fixture.nativeElement.textContent).toContain('+150.75');
    });

    it('should display balance after', () => {
      expect(fixture.nativeElement.textContent).toContain('1,500.00');
    });

    it('should display the transaction id', () => {
      expect(fixture.nativeElement.textContent).toContain('#42');
    });

    it('should have an export PDF link pointing to the backend endpoint', () => {
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.export-btn');
      expect(link).toBeTruthy();
      expect(link.textContent?.trim()).toBe('Export as PDF');
      expect(link.getAttribute('href')).toBe('/api/transactions/42/pdf');
    });

    it('should have a back link to the account page', () => {
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.back-link');
      expect(link.getAttribute('href')).toBe('/accounts/1');
    });

    it('should show − prefix for DEBIT transactions', () => {
      store.setState(stateWith({ ...mockTx, type: 'DEBIT' }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.amount--debit').length).toBeGreaterThan(0);
      expect(fixture.nativeElement.textContent).toContain('−150.75');
    });
  });

  describe('without a transaction in store', () => {
    it('should redirect to home when selectedTransaction is null', async () => {
      await setup(null);
      const navigateSpy = vi.spyOn(router, 'navigate');
      fixture.componentInstance.ngOnInit();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });
});
