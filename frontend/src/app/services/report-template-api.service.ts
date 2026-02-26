import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type {
  ReportTemplateDto,
  ReportTemplatePutDto,
} from '../models/report-template.model';

const LOG = '[ReportTemplateApi]';

@Injectable({ providedIn: 'root' })
export class ReportTemplateApiService {
  private readonly api = '/api';

  constructor(private readonly http: HttpClient) {}

  /** Получить шаблон отчёта юнита. 404 — шаблон не задан. */
  getByUnitId(unitId: number): Observable<ReportTemplateDto> {
    const url = `${this.api}/units/${unitId}/report-template`;
    return this.http.get<ReportTemplateDto>(url).pipe(
      tap((t) => console.log(LOG, 'getByUnitId', unitId, 'ok', t.plugins?.length ?? 0, 'plugins')),
      tap({
        error: (err: { status?: number; error?: unknown }) =>
          console.error(LOG, 'getByUnitId', unitId, 'error', err?.status, err?.error ?? err),
      })
    );
  }

  /** Создать или обновить шаблон отчёта юнита. */
  putByUnitId(
    unitId: number,
    body: ReportTemplatePutDto
  ): Observable<ReportTemplateDto> {
    const url = `${this.api}/units/${unitId}/report-template`;
    console.log(LOG, 'putByUnitId', unitId, 'plugins=', body.plugins?.length ?? 0);
    return this.http.put<ReportTemplateDto>(url, body).pipe(
      tap((t) => console.log(LOG, 'putByUnitId', unitId, 'ok', 'templateId=', t.id)),
      tap({
        error: (err: { status?: number; statusText?: string; error?: unknown; message?: string }) =>
          console.error(LOG, 'putByUnitId', unitId, 'error', err?.status, err?.statusText, err?.error ?? err?.message ?? err),
      })
    );
  }
}
