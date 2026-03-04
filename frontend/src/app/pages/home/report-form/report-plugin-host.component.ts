import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewContainerRef,
  ComponentRef,
  Injector,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { ReportPluginRegistryService } from '../../../services/report-plugin-registry.service';
import type { ReportPluginDataDto } from '../../../models/report.model';
import type { ReportPluginData, ReportRatingValue } from '../../../plugins/types';

@Component({
  selector: 'app-report-plugin-host',
  standalone: true,
  template: '',
  styles: [':host { display: block; }'],
})
export class ReportPluginHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() pluginId!: string;
  @Input() customTitle: string | null = null;
  @Input() data!: ReportPluginDataDto;
  @Input() unitId!: number;
  @Input() reportDate!: string;

  @Output() dataChange = new EventEmitter<ReportPluginDataDto>();

  private compRef: ComponentRef<{ data: ReportPluginData }> | null = null;

  constructor(
    private readonly vcr: ViewContainerRef,
    private readonly injector: Injector,
    private readonly registry: ReportPluginRegistryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    const ComponentClass = this.registry.getComponent(this.pluginId);
    const entry = this.registry.getEntry(this.pluginId);
    if (!ComponentClass || !entry) return;
    this.compRef = this.vcr.createComponent(ComponentClass as never, {
      injector: this.injector,
    });
    const instance = this.compRef.instance as unknown as {
      pluginId: string;
      label: string;
      group: string;
      defaultPrompt: string;
      unitId: number | null;
      reportDate: string | null;
      data: ReportPluginData;
      dataChange: EventEmitter<ReportPluginData>;
    };
    instance.pluginId = this.pluginId;
    instance.label = this.customTitle?.trim() ? this.customTitle : entry.label;
    instance.group = entry.group;
    instance.defaultPrompt = entry.defaultPrompt;
    instance.unitId = this.unitId;
    instance.reportDate = this.reportDate;
    instance.data = {
      llmMarkdown: this.data.llmMarkdown ?? '',
      userAnalysis: this.data.userAnalysis ?? '',
      rating: this.data.rating as ReportRatingValue | null,
    };
    instance.dataChange.subscribe((next: ReportPluginData) => {
      this.dataChange.emit({
        pluginId: this.pluginId,
        customTitle: this.customTitle,
        sortOrder: this.data.sortOrder,
        llmMarkdown: next.llmMarkdown,
        userAnalysis: next.userAnalysis,
        rating: next.rating,
      });
    });
    this.cdr.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.compRef && changes['data'] && this.data) {
      const instance = this.compRef.instance as { data: ReportPluginData };
      instance.data = {
        llmMarkdown: this.data.llmMarkdown ?? '',
        userAnalysis: this.data.userAnalysis ?? '',
        rating: this.data.rating as ReportRatingValue | null,
      };
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.compRef?.destroy();
    this.compRef = null;
  }
}
