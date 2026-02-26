import type { IReportPlugin } from '../../types';
import type { Type } from '@angular/core';
import { CustomReportPluginComponent } from './custom-report-plugin.component';

/** Элемент реестра: контракт плагина + класс компонента для динамического рендера */
export interface ReportPluginEntry extends IReportPlugin {
  component: Type<unknown>;
}

/**
 * Плагины группы Other.
 */
export const OTHER_PLUGINS: ReportPluginEntry[] = [
  {
    pluginId: 'custom',
    label: 'Custom',
    group: 'other',
    defaultPrompt: '',
    component: CustomReportPluginComponent,
  },
];
