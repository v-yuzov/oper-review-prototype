import type { IReportPlugin } from '../../types';
import type { Type } from '@angular/core';
import {
  TeamLeadTimePluginComponent,
  TEAM_LEAD_TIME_DEFAULT_PROMPT,
} from './team-lead-time/team-lead-time-plugin.component';
import {
  WipPluginComponent,
  WIP_DEFAULT_PROMPT,
} from './wip/wip-plugin.component';

/** Элемент реестра: контракт плагина + класс компонента для динамического рендера */
export interface ReportPluginEntry extends IReportPlugin {
  component: Type<unknown>;
}

/**
 * Плагины группы Delivery.
 */
export const DELIVERY_PLUGINS: ReportPluginEntry[] = [
  {
    pluginId: 'team-lead-time',
    label: 'Team Lead Time',
    group: 'delivery',
    defaultPrompt: TEAM_LEAD_TIME_DEFAULT_PROMPT,
    component: TeamLeadTimePluginComponent,
  },
  {
    pluginId: 'wip',
    label: 'Work In Progress',
    group: 'delivery',
    defaultPrompt: WIP_DEFAULT_PROMPT,
    component: WipPluginComponent,
  },
];
