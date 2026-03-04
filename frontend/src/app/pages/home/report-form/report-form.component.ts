import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { TuiButton, TuiLoader, TuiSurface } from '@taiga-ui/core';
import html2canvas from 'html2canvas';
import { ReportTemplateApiService } from '../../../services/report-template-api.service';
import { ReportsApiService } from '../../../services/reports-api.service';
import type { ReportTemplateDto } from '../../../models/report-template.model';
import type { ReportDto, ReportPluginDataDto, ReportPutDto } from '../../../models/report.model';
import type { ReportPluginData } from '../../../plugins/types';
import type { ReportTemplatePluginDto } from '../../../models/report-template.model';
import { ReportPluginRegistryService } from '../../../services/report-plugin-registry.service';
import { TeamLeadTimePluginComponent } from '../../../plugins/groups/delivery/team-lead-time/team-lead-time-plugin.component';
import { WipPluginComponent } from '../../../plugins/groups/delivery/wip/wip-plugin.component';
import { CustomReportPluginComponent } from '../../../plugins/groups/other/custom-report-plugin.component';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TuiButton,
    TuiLoader,
    TuiSurface,
    TeamLeadTimePluginComponent,
    WipPluginComponent,
    CustomReportPluginComponent,
  ],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.scss'],
})
export class ReportFormComponent implements OnInit {
  @ViewChild('reportFormContainer') reportFormContainer!: ElementRef<HTMLElement>;

  unitId = signal<number | null>(null);
  reportId = signal<number | null>(null);
  template = signal<ReportTemplateDto | null>(null);
  report = signal<ReportDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);

  reportDate = signal('');
  pluginsData = signal<ReportPluginDataDto[]>([]);
  /** Зафиксированный снапшот графика (из кнопки «Зафиксировать» в плагине); при save уходит в БД. */
  reportSnapshot = signal<string | null>(null);

  isEdit = computed(() => this.reportId() != null);
  templatePlugins = computed(() => this.template()?.plugins ?? []);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly templateApi: ReportTemplateApiService,
    private readonly reportsApi: ReportsApiService,
    private readonly registry: ReportPluginRegistryService,
    private readonly cdr: ChangeDetectorRef
  ) {
    console.log('[ReportFormComponent] constructor');
  }

  /** Данные плагина для биндинга [data] (формат ReportPluginData). */
  toPluginData(d: ReportPluginDataDto): ReportPluginData {
    return {
      llmMarkdown: d.llmMarkdown ?? '',
      userAnalysis: d.userAnalysis ?? '',
      rating: d.rating as ReportPluginData['rating'],
    };
  }

  /** Заголовок плагина: customTitle из шаблона или дефолт по pluginId. */
  getPluginLabel(plugin: ReportTemplatePluginDto): string {
    return plugin.customTitle?.trim() ? plugin.customTitle : this.registry.getDefaultLabel(plugin.pluginId);
  }

  /** Обработчик dataChange от статического плагина: собирает ReportPluginDataDto и обновляет состояние. */
  onPluginDataFromPlugin(
    index: number,
    plugin: ReportTemplatePluginDto,
    data: ReportPluginData
  ): void {
    this.onPluginDataChange(index, {
      pluginId: plugin.pluginId,
      customTitle: plugin.customTitle,
      sortOrder: index,
      llmMarkdown: data.llmMarkdown,
      userAnalysis: data.userAnalysis,
      rating: data.rating,
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const uid = params.get('id');
          const rid = params.get('reportId');
          const unitId = uid ? parseInt(uid, 10) : null;
          const reportId = rid && rid !== 'new' ? parseInt(rid, 10) : null;
          this.unitId.set(unitId);
          this.reportId.set(reportId);
          this.loading.set(true);
          this.error.set(null);
          this.cdr.markForCheck();
          if (unitId == null || isNaN(unitId)) return of(null);
          return this.templateApi.getTemplateByHierarchy(unitId).pipe(
            switchMap((t) => {
              this.template.set(t);
              console.log('[ReportFormComponent] template set, plugins:', t.plugins?.length, t.plugins?.map((p) => p.pluginId));
              if (reportId != null && !isNaN(reportId)) {
                return this.reportsApi.getOne(unitId, reportId).pipe(
                  catchError(() => of(null))
                );
              }
              const today = new Date().toISOString().slice(0, 10);
              this.reportDate.set(today);
              this.pluginsData.set(
                t.plugins.map((p, i) => ({
                  pluginId: p.pluginId,
                  customTitle: p.customTitle,
                  sortOrder: i,
                  llmMarkdown: '',
                  userAnalysis: '',
                  rating: null,
                }))
              );
              return of(null);
            }),
            catchError((err) => {
              this.error.set(
                err?.status === 404
                  ? 'В иерархии подразделения не найден шаблон отчёта. Настройте шаблон у предка.'
                  : 'Не удалось загрузить форму'
              );
              return of(null);
            })
          );
        })
      )
      .subscribe((report) => {
        if (report) {
          this.report.set(report);
          this.reportDate.set(report.reportDate);
          this.reportSnapshot.set(report.snapshotBase64 ?? null);
          const t = this.template();
          const merged =
            t?.plugins.map((tp, i) => {
              const rp = report.plugins.find((p) => p.pluginId === tp.pluginId);
              return rp
                ? { ...rp, sortOrder: i }
                : {
                    pluginId: tp.pluginId,
                    customTitle: tp.customTitle,
                    sortOrder: i,
                    llmMarkdown: '',
                    userAnalysis: '',
                    rating: null,
                  };
            }) ?? report.plugins;
          this.pluginsData.set(merged);
        } else {
          this.reportSnapshot.set(null);
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      });
  }

  onPluginDataChange(index: number, dto: ReportPluginDataDto): void {
    const list = [...this.pluginsData()];
    if (index >= 0 && index < list.length) {
      list[index] = { ...dto, sortOrder: index };
      this.pluginsData.set(list);
      this.cdr.markForCheck();
    }
  }

  /** Вызывается при нажатии «Зафиксировать» в плагине; снапшот пойдёт в БД при save(). */
  onSnapshotCapture(dataUrl: string): void {
    this.reportSnapshot.set(dataUrl);
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    const uid = this.unitId();
    const rid = this.reportId();
    if (uid == null) return;
    const body: ReportPutDto = {
      reportDate: this.reportDate(),
      snapshotBase64: this.reportSnapshot() ?? null,
      plugins: this.pluginsData().map((p, i) => ({ ...p, sortOrder: i })),
    };
    // Если снапшот не зафиксирован кнопкой в плагине — не делаем полный снимок формы (оставляем null).
    if (body.snapshotBase64 == null) {
      try {
        const el = this.reportFormContainer?.nativeElement;
        if (el) {
          const canvas = await html2canvas(el, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            logging: false,
          });
          body.snapshotBase64 = canvas.toDataURL('image/png');
        }
      } catch {
        // snapshot optional
      }
    }
    this.saving.set(true);
    this.cdr.markForCheck();
    const req =
      rid != null
        ? this.reportsApi.update(uid, rid, body)
        : this.reportsApi.create(uid, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/unit', uid], { queryParams: { tab: 'reports' } });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(
          err?.error?.error ?? err?.message ?? 'Не удалось сохранить отчёт'
        );
        this.saving.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    const uid = this.unitId();
    if (uid != null) this.router.navigate(['/unit', uid], { queryParams: { tab: 'reports' } });
  }
}
