import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LlmAnalyzeRequest {
  pluginPrompt: string;
  chartDataJson?: string | null;
}

export interface LlmAnalyzeResponse {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class LlmApiService {
  private readonly api = '/api';

  constructor(private readonly http: HttpClient) {}

  analyze(body: LlmAnalyzeRequest): Observable<LlmAnalyzeResponse> {
    return this.http.post<LlmAnalyzeResponse>(`${this.api}/llm/analyze`, body);
  }
}
