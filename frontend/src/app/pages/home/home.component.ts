import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { TuiSurface, TuiButton, TuiLoader } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit/components/tabs';
import { UnitsApiService } from '../../services/units-api.service';
import { ReportTemplateSettingsComponent } from './report-template-settings/report-template-settings.component';
import type { UnitViewDto } from '../../models/unit-view.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TuiSurface,
    TuiButton,
    TuiLoader,
    TuiTabs,
    ReportTemplateSettingsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  unit: UnitViewDto | null = null;
  loading = true;
  error: string | null = null;

  /** Индекс активной вкладки: 0 = Состав, 1 = Опреревью */
  activeTabIndex = 0;

  /** Индекс вложенной вкладки Опреревью: 0 = Отчеты, 1 = Настройки */
  activeOperereviewTabIndex = 0;

  /** Цвет подчёркивания активной табы */
  readonly tabUnderlineColor = 'rgb(255, 221, 45)';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly unitsApi: UnitsApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => {
        this.loading = true;
        this.error = null;
        this.unit = null;
        this.cdr.markForCheck();
      }),
      switchMap((params) => {
        const id = params.get('id');
        const numId = id ? parseInt(id, 10) : null;
        const request = numId != null
          ? this.unitsApi.getUnitById(numId)
          : this.unitsApi.getRootUnit();
        return request.pipe(
          tap((data) => {
            this.unit = data;
            this.loading = false;
            this.error = null;
            this.cdr.markForCheck();
          }),
          catchError((err: { status?: number; message?: string; error?: { error?: string } }) => {
            this.loading = false;
            if (err?.status === 404 && numId != null) {
              this.router.navigate(['/'], { replaceUrl: true });
              return EMPTY;
            }
            this.error =
              (err?.error && typeof err.error === 'object' && err.error?.error) ||
              err?.message ||
              (err?.status === 404 ? 'Подразделение не найдено' : 'Ошибка загрузки');
            this.cdr.markForCheck();
            return EMPTY;
          })
        );
      })
    ).subscribe();
  }

  hasChildren(): boolean {
    return !!this.unit && this.unit.children.length > 0;
  }

}
