vi.mock('chart.js/auto', () => ({
  // eslint-disable-next-line prefer-arrow-callback
  default: vi.fn(function () {
    return {
      destroy: vi.fn(),
      update: vi.fn(),
      data: { labels: [] as string[], datasets: [{ data: [] as number[] }] },
    };
  }),
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import Chart from 'chart.js/auto';
import { BalanceChartComponent } from './balance-chart.component';
import { Transaction } from '../../models/transaction.model';

const MockChart = Chart as unknown as {
  new (...args: any[]): { destroy: () => void; update: (mode?: string) => void; data: { labels: string[]; datasets: Array<{ data: number[] }> } };
  mock: { calls: any[][]; results: Array<{ value: any }> };
  mockClear(): void;
};

const mockTransactions: Transaction[] = [
  { id: 1, accountId: 1, amount: 100, type: 'CREDIT', description: 'Deposit',  balanceAfter: 100, createdAt: '2024-01-01T10:00:00' },
  { id: 2, accountId: 1, amount: 50,  type: 'DEBIT',  description: 'Payment',  balanceAfter: 50,  createdAt: '2024-01-02T10:00:00' },
  { id: 3, accountId: 1, amount: 200, type: 'CREDIT', description: 'Transfer', balanceAfter: 250, createdAt: '2024-01-03T10:00:00' },
];

describe('BalanceChartComponent', () => {
  let fixture: ComponentFixture<BalanceChartComponent>;

  beforeEach(async () => {
    MockChart.mockClear();

    await TestBed.configureTestingModule({
      imports: [BalanceChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceChartComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a canvas element', () => {
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });

  it('should instantiate Chart.js once on init', () => {
    expect(MockChart).toHaveBeenCalledOnce();
  });

  it('should call Chart.js with a line type', () => {
    const config = MockChart.mock.calls[0][1] as any;
    expect(config.type).toBe('line');
  });

  it('should call update when transactions input changes', () => {
    const instance = MockChart.mock.results[0].value;
    fixture.componentRef.setInput('transactions', mockTransactions);
    fixture.detectChanges();
    expect(instance.update).toHaveBeenCalledWith('none');
  });

  it('should set chart data sorted oldest-first regardless of input order', () => {
    const unordered: Transaction[] = [
      { id: 3, accountId: 1, amount: 200, type: 'CREDIT', description: 'C', balanceAfter: 250, createdAt: '2024-01-03T10:00:00' },
      { id: 1, accountId: 1, amount: 100, type: 'CREDIT', description: 'A', balanceAfter: 100, createdAt: '2024-01-01T10:00:00' },
      { id: 2, accountId: 1, amount: 50,  type: 'DEBIT',  description: 'B', balanceAfter: 50,  createdAt: '2024-01-02T10:00:00' },
    ];
    fixture.componentRef.setInput('transactions', unordered);
    fixture.detectChanges();
    const instance = MockChart.mock.results[0].value;
    expect(instance.data.datasets[0].data).toEqual([100, 50, 250]);
  });

  it('should produce as many labels as data points', () => {
    fixture.componentRef.setInput('transactions', mockTransactions);
    fixture.detectChanges();
    const instance = MockChart.mock.results[0].value;
    expect(instance.data.labels.length).toBe(instance.data.datasets[0].data.length);
  });

  it('should destroy the Chart instance on component destroy', () => {
    const instance = MockChart.mock.results[0].value;
    fixture.destroy();
    expect(instance.destroy).toHaveBeenCalled();
  });

  it('should not throw when transactions input is empty', () => {
    expect(() => {
      fixture.componentRef.setInput('transactions', []);
      fixture.detectChanges();
    }).not.toThrow();
  });
});
