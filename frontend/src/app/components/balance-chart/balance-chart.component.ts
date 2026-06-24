import {
  ChangeDetectionStrategy, Component, effect, ElementRef,
  input, OnDestroy, ViewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-balance-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-wrapper">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      background: #1e2330;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.25rem;
      height: 180px;
      position: relative;
    }

    .chart-wrapper canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
})
export class BalanceChartComponent implements OnDestroy {
  transactions = input<Transaction[]>([]);

  private chartInstance?: Chart;

  constructor() {
    effect(() => {
      const txs = this.transactions();
      if (this.chartInstance) {
        this.updateChartData(txs);
      }
    });
  }

  @ViewChild('chartCanvas')
  set chartCanvas(el: ElementRef<HTMLCanvasElement> | undefined) {
    if (el) {
      this.createChart(el.nativeElement, this.transactions());
    } else {
      this.chartInstance?.destroy();
      this.chartInstance = undefined;
    }
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
  }

  private createChart(canvas: HTMLCanvasElement, transactions: Transaction[]): void {
    this.chartInstance?.destroy();
    const { labels, data } = this.buildChartData(transactions);
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          fill: true,
          backgroundColor: (ctx: any) => {
            const { ctx: c, chartArea } = ctx.chart;
            if (!chartArea) return 'rgba(79,99,216,0)';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(79,99,216,0.3)');
            gradient.addColorStop(1, 'rgba(79,99,216,0)');
            return gradient;
          },
          borderColor: '#6c7ee1',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: data.length > 30 ? 0 : 3,
          pointBackgroundColor: '#6c7ee1',
          pointHoverRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#252b3b',
            titleColor: 'rgba(255,255,255,0.5)',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: 'rgba(255,255,255,0.35)', maxTicksLimit: 6, font: { size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 11 } },
            border: { display: false },
          },
        },
      },
    });
  }

  private updateChartData(transactions: Transaction[]): void {
    if (!this.chartInstance) return;
    const { labels, data } = this.buildChartData(transactions);
    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = data;
    this.chartInstance.update('none');
  }

  private buildChartData(transactions: Transaction[]): { labels: string[]; data: number[] } {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return {
      labels: sorted.map(t => fmt.format(new Date(t.createdAt))),
      data: sorted.map(t => Number(t.balanceAfter)),
    };
  }
}
