import {
  Component,
  Input,
  ViewChild,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportPluginBaseComponent } from '../../base/report-plugin-base.component';
import { PluginGroup } from '../../types';
import type { IReportPluginComponent } from '../../types';

/**
 * Примитивный плагин: вместо графика — вставка произвольного скриншота
 * (пользователь подставляет свой кастомный график в виде изображения).
 * Промпт пустой, заголовок "Custom", группа Other.
 */
@Component({
  selector: 'app-custom-report-plugin',
  standalone: true,
  imports: [CommonModule, ReportPluginBaseComponent],
  template: `
    <app-report-plugin-base
      #pluginBase
      pluginId="custom"
      label="Custom"
      [group]="group"
      [defaultPrompt]="defaultPrompt"
      [prompt]="prompt"
      [unitId]="unitId"
      [reportDate]="reportDate"
      [data]="data"
      (dataChange)="dataChange.emit($event)"
    >
      <ng-template #visualization>
        <div class="custom-viz" #vizHost>
          <input
            type="file"
            #fileInput
            accept="image/*"
            (change)="onFileSelected($event)"
            class="custom-viz__input"
          />
          @if (imageDataUrl) {
            <div class="custom-viz__preview">
              <img [src]="imageDataUrl" alt="Скриншот" class="custom-viz__img" />
            </div>
          } @else {
            <div
              class="custom-viz__placeholder"
              (click)="fileInput.click()"
              (paste)="onPaste($event)"
              tabindex="0"
            >
              <span class="custom-viz__hint">Вставьте скриншот</span>
              <span class="custom-viz__sub">(файл или Ctrl+V)</span>
            </div>
          }
        </div>
      </ng-template>
    </app-report-plugin-base>
  `,
  styles: [
    `
      .custom-viz {
        min-height: 200px;
        position: relative;
      }
      .custom-viz__input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
      }
      .custom-viz__placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        border: 2px dashed var(--tui-border-normal, #ccc);
        border-radius: 8px;
        cursor: pointer;
        color: var(--tui-text-02, #666);
        gap: 4px;
      }
      .custom-viz__placeholder:hover {
        border-color: var(--tui-primary, #0066ff);
        color: var(--tui-text-01, #333);
      }
      .custom-viz__placeholder:focus {
        outline: none;
        border-color: var(--tui-primary, #0066ff);
      }
      .custom-viz__hint {
        font-weight: 500;
      }
      .custom-viz__sub {
        font-size: 0.875rem;
        opacity: 0.8;
      }
      .custom-viz__preview {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }
      .custom-viz__img {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
        display: block;
      }
    `,
  ],
})
export class CustomReportPluginComponent
  extends ReportPluginBaseComponent
  implements IReportPluginComponent
{
  override group = PluginGroup.Other;

  /** Пустой промпт по умолчанию */
  override defaultPrompt = '';

  @Input() override prompt: string | null = null;

  /** Data URL вставленного изображения */
  imageDataUrl: string | null = null;

  @ViewChild('pluginBase') private pluginBase!: ReportPluginBaseComponent;

  @ViewChild('vizHost') private vizHost!: ElementRef<HTMLElement>;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file?.type.startsWith('image/')) {
      this.loadFileAsDataUrl(file);
    }
    input.value = '';
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const host = this.vizHost?.nativeElement;
    if (!host?.contains(document.activeElement)) {
      return;
    }
    const item = event.clipboardData?.items?.[0];
    if (item?.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        this.loadFileAsDataUrl(file);
      }
    }
  }

  private loadFileAsDataUrl(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      this.imageDataUrl =
        typeof result === 'string' ? result : null;
    };
    reader.readAsDataURL(file);
  }

  override getChartSnapshot(): Promise<string> {
    if (this.imageDataUrl) {
      return Promise.resolve(this.imageDataUrl);
    }
    return this.pluginBase.getChartSnapshot();
  }
}
