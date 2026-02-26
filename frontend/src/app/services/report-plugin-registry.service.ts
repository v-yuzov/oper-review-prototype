import { Injectable } from '@angular/core';
import { DELIVERY_PLUGINS } from '../plugins/groups/delivery';
import { OTHER_PLUGINS } from '../plugins/groups/other';

/** Элемент библиотеки плагинов (label для UI, pluginId для сохранения). */
export interface PluginLibraryItem {
  pluginId: string;
  label: string;
  group: string;
}

/** Все плагины из всех групп для выбора в шаблоне. */
const ALL_PLUGINS: PluginLibraryItem[] = [
  ...DELIVERY_PLUGINS.map((p) => ({ pluginId: p.pluginId, label: p.label, group: p.group })),
  ...OTHER_PLUGINS.map((p) => ({ pluginId: p.pluginId, label: p.label, group: p.group })),
];

@Injectable({ providedIn: 'root' })
export class ReportPluginRegistryService {
  /** Список плагинов для добавления в шаблон (по одному каждого типа, кроме custom). */
  getLibrary(): PluginLibraryItem[] {
    return ALL_PLUGINS;
  }

  /** Заголовок плагина по умолчанию по pluginId. */
  getDefaultLabel(pluginId: string): string {
    const entry = ALL_PLUGINS.find((p) => p.pluginId === pluginId);
    return entry?.label ?? pluginId;
  }

  /** Можно ли добавить плагин в шаблон несколько раз (только custom). */
  canAddMultiple(pluginId: string): boolean {
    return pluginId === 'custom';
  }
}
