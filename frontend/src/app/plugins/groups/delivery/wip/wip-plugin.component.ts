import { Component, Input, ViewChild } from '@angular/core';
import { ReportPluginBaseComponent } from '../../../base/report-plugin-base.component';
import { PluginGroup } from '../../../types';
import type { IReportPluginComponent } from '../../../types';
import { WipChartComponent } from './wip-chart.component';
import { type WipDataPoint, MOCK_WIP_DATA } from './wip-data';

/** Дефолтный промпт для LLM (для реестра и переопределения). */
export const WIP_DEFAULT_PROMPT = `Ты аналитик процессов в ИТ команде. Тебе для анализа подаются данные по WIP (work in progress) команды - среднее количество задач в рабочих статусах за день с группировкой по классам задач. Пример:
[
  {
    "date": "2026-01",
    "categories": {
      "Бизнес": 8,
      "Техника": 8
    }
  },
  {
    "date": "2026-02",
    "categories": {
      "Баг": 5,
      "Бизнес": 13,
      "Техника": 28
    }
  }
]

Нужно проанализировать полученные данные и сформулировать короткий 4-5 предложений вердикт по динамике метрики, какие точки роста видишь и какой тренд - требует ли более детального внимания менеджеров. Обрати внимание на:
- насколько в процентном соотношении команда делает бизнес задач, достаточно ли этой доли?
- соблюдает ли команда WIP лимиты или есть подозрения на то, что не соблюдает`;

/**
 * Плагин отчёта «Work In Progress»: накопительная столбчатая диаграмма по категориям за месяцы.
 * Группа Delivery.
 */
@Component({
  selector: 'app-wip-plugin',
  standalone: true,
  imports: [ReportPluginBaseComponent, WipChartComponent],
  template: `
    <app-report-plugin-base
      #pluginBase
      pluginId="wip"
      label="Work In Progress"
      [group]="group"
      [defaultPrompt]="defaultPrompt"
      [prompt]="prompt"
      [unitId]="unitId"
      [reportDate]="reportDate"
      [data]="data"
      (dataChange)="dataChange.emit($event)"
    >
      <ng-template #visualization>
        <app-wip-chart [chartData]="chartData" />
      </ng-template>
    </app-report-plugin-base>
  `,
})
export class WipPluginComponent
  extends ReportPluginBaseComponent
  implements IReportPluginComponent
{
  override group = PluginGroup.Delivery;

  override defaultPrompt = WIP_DEFAULT_PROMPT;

  @Input() override prompt: string | null = null;

  /** Данные для графика (JSON); по умолчанию — мок */
  @Input() chartData: WipDataPoint[] = MOCK_WIP_DATA;

  @ViewChild('pluginBase') private pluginBase!: ReportPluginBaseComponent;

  override getChartSnapshot(): Promise<string> {
    return this.pluginBase.getChartSnapshot();
  }
}
