import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UnitViewDto } from '../models/unit-view.model';

const LOG = '[UnitsApi]';

@Injectable({ providedIn: 'root' })
export class UnitsApiService {
  private readonly api = '/api';

  constructor(private readonly http: HttpClient) {}

  getRootUnit(): Observable<UnitViewDto> {
    const url = `${this.api}/units/root`;
    console.log(LOG, 'getRootUnit', url);
    return this.http.get<UnitViewDto>(url).pipe(
      tap(() => console.log(LOG, 'getRootUnit response OK')),
      tap({ error: (e) => console.error(LOG, 'getRootUnit failed', e) })
    );
  }

  getUnitById(id: number): Observable<UnitViewDto> {
    const url = `${this.api}/units/${id}`;
    console.log(LOG, 'getUnitById', url);
    return this.http.get<UnitViewDto>(url).pipe(
      tap(() => console.log(LOG, 'getUnitById response OK')),
      tap({
        error: (e: { status?: number; error?: { error?: string } }) => {
          console.error(LOG, 'getUnitById failed', e?.status, e?.error?.error ?? e?.error ?? e);
        },
      })
    );
  }
}
