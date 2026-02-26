import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  ViewChild,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  type PluginGroupId,
  type ReportRatingValue,
  type ReportPluginData,
  ReportRating,
  ReportRatingLabel,
  PluginGroupLabel,
} from '../types';
import { TuiSurface } from '@taiga-ui/core';
import { TuiTextarea } from '@taiga-ui/kit/components/textarea';
import { TuiSegmented } from '@taiga-ui/kit/components/segmented';
import html2canvas from 'html2canvas';

/**
 * Базовый компонент для всех плагинов кастомного отчёта.
 *
 * Плагин состоит из блоков:
 * - Визуализация (кастомная, задаётся через ng-content #visualization)
 * - Текстовое поле с результатом анализа от LLM (Markdown)
 * - Текстовое поле анализа пользователя (Taiga Textarea)
 * - Трёхбальная оценка: Отлично / Есть над чем поработать / Плохо
 *
 * Используется через композицию: конкретный плагин задаёт pluginId, label, group
 * и передаёт их сюда, а визуализацию проектирует в #visualization.
 */
@Component({
  selector: 'app-report-plugin-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiSurface,
    TuiTextarea,
    TuiSegmented,
  ],
  templateUrl: './report-plugin-base.component.html',
  styleUrls: ['./report-plugin-base.component.scss'],
})
export class ReportPluginBaseComponent {
  /** Уникальный идентификатор плагина (задаётся обёрткой) */
  @Input() pluginId = '';

  /** Название плагина для UI (задаётся обёрткой) */
  @Input() label = '';

  /** Группа: Delivery, HR, Finance, Other (задаётся обёрткой) */
  @Input() group: PluginGroupId = 'other';

  /** Дефолтный промпт для LLM (задаётся обёрткой) */
  @Input() defaultPrompt = '';

  /** Переопределение промпта снаружи; если задано, используется вместо defaultPrompt */
  @Input() prompt: string | null = null;

  readonly ReportRating = ReportRating;
  readonly ReportRatingLabel = ReportRatingLabel;
  readonly PluginGroupLabel = PluginGroupLabel;

  /** Идентификатор юнита */
  @Input() unitId: number | null = null;

  /** Дата отчёта (YYYY-MM-DD) */
  @Input() reportDate: string | null = null;

  /** Данные плагина (LLM, пользователь, рейтинг) */
  @Input() data: ReportPluginData = {
    llmMarkdown: '',
    userAnalysis: '',
    rating: null,
  };

  @Output() dataChange = new EventEmitter<ReportPluginData>();

  /** Шаблон кастомной визуализации (чарты и т.д.), передаётся из наследника через content */
  @ContentChild('visualization') visualizationRef: TemplateRef<unknown> | null =
    null;

  /** Контейнер визуализации для снапшота (см. getChartSnapshot) */
  @ViewChild('vizContainer') vizContainerRef: ElementRef<HTMLElement> | null =
    null;

  /** Эффективный промпт: переопределение снаружи или дефолт плагина */
  get effectivePrompt(): string {
    return this.prompt ?? this.defaultPrompt;
  }

  get groupLabel(): string {
    return PluginGroupLabel[this.group];
  }

  /** Индекс для tui-segmented (0-based); rating 1,2,3 -> 0,1,2 */
  get ratingIndex(): number {
    if (this.data.rating == null) return 0;
    return this.data.rating - 1;
  }

  onRatingIndexChange(index: number): void {
    const value = (index + 1) as ReportRatingValue;
    this.onRatingChange(value);
  }

  onLlmMarkdownChange(value: string): void {
    this.emitDataChange({ ...this.data, llmMarkdown: value });
  }

  onUserAnalysisChange(value: string): void {
    this.emitDataChange({ ...this.data, userAnalysis: value });
  }

  onRatingChange(value: ReportRatingValue): void {
    this.emitDataChange({ ...this.data, rating: value });
  }

  private emitDataChange(next: ReportPluginData): void {
    this.data = next;
    this.dataChange.emit(next);
  }

  /**
   * Возвращает снапшот текущего графика (блока визуализации) в base64 (data URL image/png).
   * Используется для экспорта или отправки в LLM.
   */
  async getChartSnapshot(): Promise<string> {
    const el = this.vizContainerRef?.nativeElement;
    if (!el) {
      return Promise.reject(new Error('Контейнер визуализации не найден'));
    }
    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  }
}
