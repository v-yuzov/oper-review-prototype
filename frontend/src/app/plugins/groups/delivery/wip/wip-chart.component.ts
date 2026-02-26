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
import type { WipDataPoint } from './wip-data';

/** Цвета категорий (по порядку: Баг, Бизнес, Регуляторка, Техника и др.) */
const CATEGORY_COLORS = [
  'rgb(180, 50, 50)',
  'rgb(30, 96, 180)',
  'rgb(80, 160, 80)',
  'rgb(230, 140, 40)',
  'rgb(120, 80, 160)',
  'rgb(60, 180, 180)',
];

@Component({
  selector: 'app-wip-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wip-chart">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      .wip-chart {
        position: relative;
        width: 100%;
        height: 280px;
      }
      .wip-chart canvas {
        display: block;
        max-height: 280px;
      }
    `,
  ],
})
export class WipChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() chartData: WipDataPoint[] = [];

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: unknown = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && changes['chartData']) {
      this.updateChartData();
    }
  }

  ngOnDestroy(): void {
    if (this.chart && typeof (this.chart as { destroy?: () => void }).destroy === 'function') {
      (this.chart as { destroy: () => void }).destroy();
    }
    this.chart = null;
  }

  private async initChart(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const { default: Chart } = await import('chart.js/auto');
    const { labels, datasets } = this.buildChartData();

    // Chart.js принимает HTMLCanvasElement; типы пакета могут требовать контекст
    this.chart = new Chart(
      canvas as unknown as CanvasRenderingContext2D,
      {
        type: 'bar',
        data: {
          labels,
          datasets,
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
              label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
                const name = ctx.dataset.label ?? '';
                const value = ctx.parsed.y;
                return `${name}: ${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            title: { display: false },
            ticks: {
              maxRotation: 45,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: 'Задач' },
            ticks: {
              stepSize: 1,
              callback: (value: number | string) =>
                typeof value === 'number' ? String(value) : value,
            },
          },
        },
      },
    }
    );
  }

  private updateChartData(): void {
    const ch = this.chart as { data: { labels: string[]; datasets: unknown[] }; update: () => void } | null;
    if (!ch) return;
    const { labels, datasets } = this.buildChartData();
    ch.data.labels = labels;
    ch.data.datasets = datasets;
    ch.update();
  }

  private buildChartData(): {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
  } {
    const labels = this.chartData.map((d) => this.formatMonthLabel(d.date));
    const categoryNames = this.getOrderedCategoryNames();
    const datasets = categoryNames.map((name, i) => ({
      label: name,
      data: this.chartData.map((d) => d.categories[name] ?? 0),
      backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
    return { labels, datasets };
  }

  private getOrderedCategoryNames(): string[] {
    const set = new Set<string>();
    for (const point of this.chartData) {
      for (const key of Object.keys(point.categories)) {
        set.add(key);
      }
    }
    return Array.from(set).sort();
  }

  private formatMonthLabel(date: string): string {
    const [y, m] = date.split('-');
    return `${y}.${m}`;
  }
}
