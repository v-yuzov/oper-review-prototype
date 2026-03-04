import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ReportDto,
  ReportListItemDto,
  ReportPutDto,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly api = '/api';

  constructor(private readonly http: HttpClient) {}

  getList(unitId: number): Observable<ReportListItemDto[]> {
    return this.http.get<ReportListItemDto[]>(`${this.api}/units/${unitId}/reports`);
  }

  getOne(unitId: number, reportId: number): Observable<ReportDto> {
    return this.http.get<ReportDto>(`${this.api}/units/${unitId}/reports/${reportId}`);
  }

  create(unitId: number, body: ReportPutDto): Observable<ReportDto> {
    return this.http.post<ReportDto>(`${this.api}/units/${unitId}/reports`, body);
  }

  update(unitId: number, reportId: number, body: ReportPutDto): Observable<ReportDto> {
    return this.http.put<ReportDto>(`${this.api}/units/${unitId}/reports/${reportId}`, body);
  }

  delete(unitId: number, reportId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/units/${unitId}/reports/${reportId}`);
  }
}
