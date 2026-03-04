import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiLoader, TuiSurface } from '@taiga-ui/core';
import { ReportsApiService } from '../../../services/reports-api.service';
import type { ReportListItemDto } from '../../../models/report.model';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TuiButton, TuiLoader, TuiSurface],
  templateUrl: './reports-list.component.html',
  styleUrls: ['./reports-list.component.scss'],
})
export class ReportsListComponent implements OnInit {
  @Input({ required: true }) unitId!: number;

  reports: ReportListItemDto[] = [];
  loading = true;
  error: string | null = null;
  deletingId: number | null = null;

  constructor(
    private readonly api: ReportsApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.getList(this.unitId).subscribe({
      next: (list) => {
        this.reports = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Не удалось загрузить список отчётов';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  deleteReport(event: Event, reportId: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.deletingId != null) return;
    this.deletingId = reportId;
    this.api.delete(this.unitId, reportId).subscribe({
      next: () => {
        this.reports = this.reports.filter((r) => r.id !== reportId);
        this.deletingId = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Не удалось удалить отчёт';
        this.deletingId = null;
        this.cdr.markForCheck();
      },
    });
  }
}
