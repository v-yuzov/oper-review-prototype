/**
 * Точка данных Lead Time по месяцу.
 */
export interface LeadTimeDataPoint {
  /** Месяц в формате YYYY-MM */
  date: string;
  /** Медиана (дни) */
  median: number;
  /** 85-й перцентиль (дни) */
  percentile_85: number;
  /** 95-й перцентиль (дни) */
  percentile_95: number;
}

/**
 * Мок данных для плагина Team Lead Time.
 */
export const MOCK_LEAD_TIME_DATA: LeadTimeDataPoint[] = [
  { date: '2025-09', median: 10, percentile_85: 28, percentile_95: 29 },
  { date: '2025-10', median: 7, percentile_85: 25, percentile_95: 40 },
  { date: '2025-11', median: 12, percentile_85: 20, percentile_95: 30 },
  { date: '2025-12', median: 9, percentile_85: 25, percentile_95: 34 },
  { date: '2026-01', median: 15, percentile_85: 35, percentile_95: 50 },
  { date: '2026-02', median: 14, percentile_85: 27, percentile_95: 45 },
];
