/**
 * Группа плагинов отчёта. В будущем список будет расширяться.
 */
export const PluginGroup = {
  Delivery: 'delivery',
  HR: 'hr',
  Finance: 'finance',
  Other: 'other',
} as const;

export type PluginGroupId = (typeof PluginGroup)[keyof typeof PluginGroup];

export const PluginGroupLabel: Record<PluginGroupId, string> = {
  [PluginGroup.Delivery]: 'Delivery',
  [PluginGroup.HR]: 'HR',
  [PluginGroup.Finance]: 'Finance',
  [PluginGroup.Other]: 'Other',
};

/**
 * Трёхбальная оценка отчёта.
 */
export const ReportRating = {
  Excellent: 1,
  NeedsWork: 2,
  Poor: 3,
} as const;

export type ReportRatingValue = (typeof ReportRating)[keyof typeof ReportRating];

export const ReportRatingLabel: Record<ReportRatingValue, string> = {
  [ReportRating.Excellent]: 'Отлично',
  [ReportRating.NeedsWork]: 'Есть над чем поработать',
  [ReportRating.Poor]: 'Плохо',
};

/**
 * Данные, общие для всех плагинов отчёта (состояние блоков).
 */
export interface ReportPluginData {
  /** Результат анализа от LLM в формате Markdown */
  llmMarkdown: string;
  /** Текст анализа пользователя */
  userAnalysis: string;
  /** Трёхбальная оценка */
  rating: ReportRatingValue | null;
}

/**
 * Контракт плагина отчёта: идентификация, группа и дефолтный промпт.
 */
export interface IReportPlugin {
  /** Уникальный идентификатор плагина */
  readonly pluginId: string;
  /** Название плагина для UI */
  readonly label: string;
  /** Группа: Delivery, HR, Finance, Other */
  readonly group: PluginGroupId;
  /** Дефолтный промпт для LLM; можно переопределить снаружи через input */
  readonly defaultPrompt: string;
}

/**
 * Контракт компонента плагина: метод снимка графика в base64.
 */
export interface IReportPluginComponent {
  /** Возвращает снапшот текущей визуализации (графика) в base64 (data URL). */
  getChartSnapshot(): Promise<string>;
}
