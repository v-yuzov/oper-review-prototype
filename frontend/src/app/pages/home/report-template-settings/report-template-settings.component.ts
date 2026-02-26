import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiSurface } from '@taiga-ui/core';
import type { ReportTemplateDto, ReportTemplatePluginDto } from '../../../models/report-template.model';
import { ReportTemplateApiService } from '../../../services/report-template-api.service';
import { ReportPluginRegistryService } from '../../../services/report-plugin-registry.service';

@Component({
  selector: 'app-report-template-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TuiButton, TuiLoader, TuiSurface],
  templateUrl: './report-template-settings.component.html',
  styleUrls: ['./report-template-settings.component.scss'],
})
export class ReportTemplateSettingsComponent implements OnInit {
  @Input({ required: true }) unitId!: number;

  template = signal<ReportTemplateDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  editing = signal(false);
  /** В режиме редактирования — текущий список плагинов (копия для правок). */
  editingPlugins = signal<ReportTemplatePluginDto[]>([]);

  library = computed(() => this.registry.getLibrary());

  constructor(
    private readonly api: ReportTemplateApiService,
    private readonly registry: ReportPluginRegistryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplate();
  }

  loadTemplate(): void {
    if (this.unitId == null) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.getByUnitId(this.unitId).subscribe({
      next: (t) => {
        this.template.set(t);
        this.editingPlugins.set(
          t.plugins.map((p) => ({
            pluginId: p.pluginId,
            customTitle: p.customTitle,
            sortOrder: p.sortOrder,
          }))
        );
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: { status?: number }) => {
        if (err?.status === 404) {
          this.template.set(null);
          this.editingPlugins.set([]);
        } else {
          this.error.set('Не удалось загрузить шаблон');
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  getDefaultLabel(pluginId: string): string {
    return this.registry.getDefaultLabel(pluginId);
  }

  getDisplayTitle(plugin: ReportTemplatePluginDto, index: number): string {
    if (plugin.customTitle?.trim()) return plugin.customTitle.trim();
    if (plugin.pluginId === 'custom') {
      const customsUpTo = this.editingPlugins()
        .slice(0, index + 1)
        .filter((p) => p.pluginId === 'custom');
      return `Custom ${customsUpTo.length}`;
    }
    return this.registry.getDefaultLabel(plugin.pluginId);
  }

  canAddPlugin(pluginId: string): boolean {
    const list = this.editingPlugins();
    if (this.registry.canAddMultiple(pluginId)) return true;
    return !list.some((p) => p.pluginId === pluginId);
  }

  startEdit(): void {
    const t = this.template();
    this.editingPlugins.set(
      t?.plugins.map((p, i) => ({
        pluginId: p.pluginId,
        customTitle: p.customTitle,
        sortOrder: i,
      })) ?? []
    );
    this.editing.set(true);
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    const t = this.template();
    this.editingPlugins.set(
      t?.plugins.map((p, i) => ({
        pluginId: p.pluginId,
        customTitle: p.customTitle,
        sortOrder: i,
      })) ?? []
    );
    this.editing.set(false);
    this.cdr.markForCheck();
  }

  addPlugin(pluginId: string): void {
    const list = [...this.editingPlugins()];
    const maxOrder = list.length === 0 ? -1 : Math.max(...list.map((p) => p.sortOrder));
    const customCount = list.filter((p) => p.pluginId === 'custom').length;
    const customTitle =
      pluginId === 'custom' ? `Custom ${customCount + 1}` : this.registry.getDefaultLabel(pluginId);
    list.push({
      pluginId,
      customTitle,
      sortOrder: maxOrder + 1,
    });
    this.editingPlugins.set(list);
    this.cdr.markForCheck();
  }

  removePlugin(index: number): void {
    const list = this.editingPlugins().filter((_, i) => i !== index);
    this.editingPlugins.set(
      list.map((p, i) => ({ ...p, sortOrder: i }))
    );
    this.cdr.markForCheck();
  }

  setPluginTitle(index: number, value: string): void {
    const list = this.editingPlugins().map((p, i) =>
      i === index ? { ...p, customTitle: value || null } : p
    );
    this.editingPlugins.set(list);
    this.cdr.markForCheck();
  }

  save(): void {
    const plugins = this.editingPlugins().map((p, i) => ({
      pluginId: p.pluginId,
      customTitle: p.customTitle,
      sortOrder: i,
    }));
    this.loading.set(true);
    this.error.set(null);
    this.api.putByUnitId(this.unitId, { plugins }).subscribe({
      next: (t) => {
        this.template.set(t);
        this.editing.set(false);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: { status?: number; statusText?: string; error?: unknown; message?: string }) => {
        console.error('[ReportTemplateSettings] save failed', {
          status: err?.status,
          statusText: err?.statusText,
          error: err?.error,
          message: err?.message,
        });
        const msg =
          typeof err?.error === 'object' && err?.error !== null && 'error' in err?.error
            ? String((err.error as { error?: string }).error)
            : err?.message ?? 'Не удалось сохранить шаблон';
        this.error.set(msg);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
