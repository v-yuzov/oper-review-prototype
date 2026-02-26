import { Component, Input, ViewChild } from '@angular/core';
import { ReportPluginBaseComponent } from '../../../base/report-plugin-base.component';
import { PluginGroup } from '../../../types';
import type { IReportPluginComponent } from '../../../types';
import { TeamLeadTimeChartComponent } from './team-lead-time-chart.component';
import {
  type LeadTimeDataPoint,
  MOCK_LEAD_TIME_DATA,
} from './lead-time-data';

/** Дефолтный промпт для LLM (для реестра и переопределения). */
export const TEAM_LEAD_TIME_DEFAULT_PROMPT = `Ты аналитик процессов в ИТ команде. Тебе для анализа подаются данные по Lead Time команды - время от точки принятия обязательства по реализации запроса до точки завершения работы над запросом. Данные даются в динамике за какой-то период в формате JSON - коллекция [месяц, медианна, 85 перцентиль, 95 перцентиль]. Пример:
[
  {
    "date": "2026-01",
    "median": 15,
    "percentile_85": 35,
    "percentile_95": 50
  },
  {
    "date": "2026-02",
    "median": 14,
    "percentile_85": 27,
    "percentile_95": 45
  }
]

Нужно проанализировать полученные данные и сформулировать короткий 4-5 предложений вердикт по динамике метрики, какие точки роста видишь и какой тренд - требует ли более детального внимания менеджеров.`;

/**
 * Плагин отчёта «Team Lead Time»: линейный график медианы и перцентилей по месяцам.
 * Группа Delivery.
 */
@Component({
  selector: 'app-team-lead-time-plugin',
  standalone: true,
  imports: [ReportPluginBaseComponent, TeamLeadTimeChartComponent],
  template: `
    <app-report-plugin-base
      #pluginBase
      pluginId="team-lead-time"
      label="Team Lead Time"
      [group]="group"
      [defaultPrompt]="defaultPrompt"
      [prompt]="prompt"
      [unitId]="unitId"
      [reportDate]="reportDate"
      [data]="data"
      (dataChange)="dataChange.emit($event)"
    >
      <ng-template #visualization>
        <app-team-lead-time-chart [chartData]="chartData" />
      </ng-template>
    </app-report-plugin-base>
  `,
})
export class TeamLeadTimePluginComponent
  extends ReportPluginBaseComponent
  implements IReportPluginComponent
{
  override group = PluginGroup.Delivery;

  override defaultPrompt = TEAM_LEAD_TIME_DEFAULT_PROMPT;

  @Input() prompt: string | null = null;

  /** Данные для графика (JSON); по умолчанию — мок */
  @Input() chartData: LeadTimeDataPoint[] = MOCK_LEAD_TIME_DATA;

  @ViewChild('pluginBase') private pluginBase!: ReportPluginBaseComponent;

  getChartSnapshot(): Promise<string> {
    return this.pluginBase.getChartSnapshot();
  }
}
