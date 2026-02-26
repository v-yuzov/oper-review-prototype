export interface ReportTemplatePluginDto {
  pluginId: string;
  customTitle: string | null;
  sortOrder: number;
}

export interface ReportTemplateDto {
  id: number;
  unitId: number;
  plugins: ReportTemplatePluginDto[];
}

export interface ReportTemplatePutDto {
  plugins: ReportTemplatePluginDto[];
}
