import { ErrorHandler, Injectable } from '@angular/core';

/**
 * Логирует необработанные ошибки с деталями для отладки NG0201 и других ошибок инжектора.
 */
@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    const err = error as Error & { ngToken?: unknown; injector?: unknown; token?: unknown; [key: string]: unknown };
    const msg = err?.message ?? String(error);
    console.error('[GlobalErrorHandler] message:', msg);
    console.error('[GlobalErrorHandler] toString:', err?.toString?.());
    if (err?.name) console.error('[GlobalErrorHandler] name:', err.name);
    // NG0201 / NullInjectorError: извлекаем токен из "No provider for TokenName" или "NG0201"
    if (typeof msg === 'string') {
      const noProviderMatch = msg.match(/No provider for ([^\s!]+)/i);
      if (noProviderMatch) {
        console.error('[GlobalErrorHandler] NG0201: отсутствует провайдер для токена:', noProviderMatch[1]);
      }
      if (msg.includes('NG0201') && !noProviderMatch) {
        console.error('[GlobalErrorHandler] NG0201 (ControlContainer?). Искомый токен — в message выше.');
      }
    }
    if (typeof err?.message === 'string' && (err.message.includes('provider') || err.message.includes('NG0201'))) {
      console.error('[GlobalErrorHandler] >>> Похоже на ошибку инжектора. Искомый токен может быть в message выше.');
    }
    if (err?.ngToken !== undefined) console.error('[GlobalErrorHandler] ngToken:', err.ngToken);
    if (err?.token !== undefined) console.error('[GlobalErrorHandler] token:', err.token);
    if (err?.injector !== undefined) console.error('[GlobalErrorHandler] injector:', err.injector);
    if ((err as Error & { cause?: unknown })?.cause) {
      console.error('[GlobalErrorHandler] cause:', (err as Error & { cause?: unknown }).cause);
    }
    try {
      const keys = err && typeof err === 'object' ? Object.keys(err) : [];
      if (keys.length > 0) {
        console.error('[GlobalErrorHandler] error keys:', keys);
        keys.forEach((k) => {
          if (!['message', 'stack', 'ngToken', 'token', 'injector'].includes(k)) {
            console.error(`[GlobalErrorHandler] error.${k}:`, (err as Record<string, unknown>)[k]);
          }
        });
      }
    } catch (e) {
      console.error('[GlobalErrorHandler] failed to log error keys', e);
    }
    if (err?.stack) console.error('[GlobalErrorHandler] stack:', err.stack);
    super.handleError(error);
  }
}
