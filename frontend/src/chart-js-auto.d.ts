/**
 * Типы для динамического импорта chart.js/auto (Chart.js регистрирует все компоненты).
 */
declare module 'chart.js/auto' {
  const Chart: new (
    context: HTMLCanvasElement | CanvasRenderingContext2D,
    config: Record<string, unknown>
  ) => { destroy: () => void; data: Record<string, unknown>; update: () => void };
  export default Chart;
}
