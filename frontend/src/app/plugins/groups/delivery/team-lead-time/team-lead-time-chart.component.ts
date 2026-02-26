import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Chart } from 'chart.js/auto';
import type { LeadTimeDataPoint } from './lead-time-data';

/** Цвета линий: медиана, 85%, 95% */
const COLORS = {
  median: 'rgb(30, 96, 180)',
  p85: 'rgb(230, 140, 40)',
  p95: 'rgb(180, 50, 50)',
};

@Component({
  selector: 'app-team-lead-time-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lead-time-chart">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      .lead-time-chart {
        position: relative;
        width: 100%;
        height: 280px;
      }
      .lead-time-chart canvas {
        display: block;
        max-height: 280px;
      }
    `,
  ],
})
export class TeamLeadTimeChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() chartData: LeadTimeDataPoint[] = [];

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && changes['chartData']) {
      this.updateChartData();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private async initChart(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const { default: Chart } = await import('chart.js/auto');
    const labels = this.chartData.map((d) => this.formatMonthLabel(d.date));
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Медиана',
            data: this.chartData.map((d) => d.median),
            borderColor: COLORS.median,
            backgroundColor: COLORS.median + '20',
            borderWidth: 2,
            tension: 0.2,
            fill: false,
          },
          {
            label: '85 перцентиль',
            data: this.chartData.map((d) => d.percentile_85),
            borderColor: COLORS.p85,
            backgroundColor: COLORS.p85 + '20',
            borderWidth: 2,
            tension: 0.2,
            fill: false,
          },
          {
            label: '95 перцентиль',
            data: this.chartData.map((d) => d.percentile_95),
            borderColor: COLORS.p95,
            backgroundColor: COLORS.p95 + '20',
            borderWidth: 2,
            tension: 0.2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} дн.`,
            },
          },
        },
        scales: {
          x: {
            title: { display: false },
            ticks: {
              maxRotation: 45,
              callback: (_, i) => labels[i] ?? '',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Дней',
            },
            ticks: {
              stepSize: 1,
              callback: (value) => (typeof value === 'number' ? String(value) : value),
            },
          },
        },
      },
    });
  }

  private updateChartData(): void {
    if (!this.chart) return;
    const labels = this.chartData.map((d) => this.formatMonthLabel(d.date));
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = this.chartData.map((d) => d.median);
    this.chart.data.datasets[1].data = this.chartData.map((d) => d.percentile_85);
    this.chart.data.datasets[2].data = this.chartData.map((d) => d.percentile_95);
    this.chart.update();
  }

  /** Формат подписи оси X: 2025.12, 2026.01 */
  private formatMonthLabel(date: string): string {
    const [y, m] = date.split('-');
    return `${y}.${m}`;
  }
}
