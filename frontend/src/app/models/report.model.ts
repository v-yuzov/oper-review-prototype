export interface ReportPluginDataDto {
  pluginId: string;
  customTitle: string | null;
  sortOrder: number;
  llmMarkdown: string;
  userAnalysis: string;
  rating: number | null;
}

export interface ReportDto {
  id: number;
  unitId: number;
  reportDate: string;
  snapshotBase64: string | null;
  plugins: ReportPluginDataDto[];
}

export interface ReportListItemDto {
  id: number;
  unitId: number;
  reportDate: string;
}

export interface ReportPutDto {
  reportDate: string;
  snapshotBase64: string | null;
  plugins: ReportPluginDataDto[];
}
