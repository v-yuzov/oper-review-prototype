import type { IReportPlugin } from '../../types';
import type { Type } from '@angular/core';
import { PlaceholderReportPluginComponent } from './placeholder-report-plugin.component';
import { CustomReportPluginComponent } from './custom-report-plugin.component';

/** Элемент реестра: контракт плагина + класс компонента для динамического рендера */
export interface ReportPluginEntry extends IReportPlugin {
  component: Type<unknown>;
}

/**
 * Плагины группы Other.
 */
const PLACEHOLDER_DEFAULT_PROMPT =
  'Проанализируй данные из приложенного графика и дай краткий вывод в формате Markdown.';

export const OTHER_PLUGINS: ReportPluginEntry[] = [
  {
    pluginId: 'placeholder',
    label: 'Пример отчёта',
    group: 'other',
    defaultPrompt: PLACEHOLDER_DEFAULT_PROMPT,
    component: PlaceholderReportPluginComponent,
  },
  {
    pluginId: 'custom',
    label: 'Custom',
    group: 'other',
    defaultPrompt: '',
    component: CustomReportPluginComponent,
  },
];
