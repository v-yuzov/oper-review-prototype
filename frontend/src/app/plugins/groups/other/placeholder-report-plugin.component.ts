import { Component, Input, ViewChild } from '@angular/core';
import { ReportPluginBaseComponent } from '../../base/report-plugin-base.component';
import { PluginGroup } from '../../types';
import type { IReportPluginComponent } from '../../types';

const DEFAULT_PROMPT =
  'Проанализируй данные из приложенного графика и дай краткий вывод в формате Markdown.';

/**
 * Пример плагина-заглушки (группа Other).
 * Демонстрирует композицию: обёртка задаёт id, label, group, defaultPrompt и проектирует визуализацию в базу.
 */
@Component({
  selector: 'app-placeholder-report-plugin',
  standalone: true,
  imports: [ReportPluginBaseComponent],
  template: `
    <app-report-plugin-base
      #pluginBase
      pluginId="placeholder"
      label="Пример отчёта"
      [group]="group"
      [defaultPrompt]="defaultPrompt"
      [prompt]="prompt"
      [unitId]="unitId"
      [reportDate]="reportDate"
      [data]="data"
      (dataChange)="dataChange.emit($event)"
    >
      <ng-template #visualization>
        <p class="placeholder-viz">График или чарт плагина (здесь — заглушка)</p>
      </ng-template>
    </app-report-plugin-base>
  `,
  styles: [
    `
      .placeholder-viz {
        margin: 0;
        font-size: 0.875rem;
        color: var(--tui-text-02, #666);
      }
    `,
  ],
})
export class PlaceholderReportPluginComponent
  extends ReportPluginBaseComponent
  implements IReportPluginComponent
{
  override group = PluginGroup.Other;

  /** Дефолтный промпт для LLM; можно переопределить через input [prompt]. */
  override defaultPrompt = DEFAULT_PROMPT;

  /** Переопределение промпта снаружи (пробрасывается в базу). */
  @Input() prompt: string | null = null;

  @ViewChild('pluginBase') private pluginBase!: ReportPluginBaseComponent;

  getChartSnapshot(): Promise<string> {
    return this.pluginBase.getChartSnapshot();
  }
}
