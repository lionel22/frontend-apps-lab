type ObservabilityWindow = typeof globalThis & {
  __musicObservabilityInitialized?: boolean;
};

type FaroInstance = import('@grafana/faro-web-sdk').Faro;

function clampSampleRate(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, 0), 1);
}

function shouldStart(sampleRate: number): boolean {
  if (sampleRate <= 0) {
    return false;
  }

  if (sampleRate >= 1) {
    return true;
  }

  return Math.random() < sampleRate;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getOriginPattern(value: string): RegExp[] {
  if (!value) {
    return [];
  }

  try {
    const origin = new URL(value).origin;
    return [new RegExp(`^${escapeRegExp(origin)}`)];
  } catch {
    return [];
  }
}

function createCorrelationId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default defineNuxtPlugin(async () => {
  const win = globalThis as ObservabilityWindow;

  if (win.__musicObservabilityInitialized) {
    return;
  }

  win.__musicObservabilityInitialized = true;

  const runtimeConfig = useRuntimeConfig();
  const { musicApiBaseUrl, observability } = runtimeConfig.public;
  const correlationId = createCorrelationId();
  const faroSampleRate = clampSampleRate(observability.faro.sampleRate, 1);
  const openReplaySampleRate = clampSampleRate(
    observability.openReplay.sampleRate,
    0.1,
  );

  let faro: FaroInstance | undefined;

  if (
    observability.faro.enabled &&
    observability.faro.url &&
    shouldStart(faroSampleRate)
  ) {
    const [{ getWebInstrumentations, initializeFaro }, { TracingInstrumentation }] =
      await Promise.all([
        import('@grafana/faro-web-sdk'),
        import('@grafana/faro-web-tracing'),
      ]);

    faro = initializeFaro({
      url: observability.faro.url,
      apiKey: observability.faro.apiKey || undefined,
      app: {
        name: observability.appName,
        version: observability.appVersion,
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation({
          instrumentationOptions: {
            propagateTraceHeaderCorsUrls: getOriginPattern(musicApiBaseUrl),
          },
        }),
      ],
    });
  }

  if (faro) {
    faro.api.pushEvent('frontend_observability_initialized', {
      correlationId,
      environment: observability.environment,
      provider: 'faro',
      service: observability.appName,
    });
  }

  if (
    !observability.openReplay.enabled ||
    !observability.openReplay.projectKey ||
    !shouldStart(openReplaySampleRate)
  ) {
    return;
  }

  const { default: Tracker } = await import('@openreplay/tracker');

  const tracker = new Tracker({
    projectKey: observability.openReplay.projectKey,
    ingestPoint: observability.openReplay.ingestPoint || undefined,
  });

  void tracker
    .start()
    .then(() => {
      tracker.setMetadata('service', observability.appName);
      tracker.setMetadata('environment', observability.environment);
      tracker.setMetadata('correlationId', correlationId);

      faro?.api.pushEvent('frontend_observability_initialized', {
        correlationId,
        environment: observability.environment,
        provider: 'openreplay',
        service: observability.appName,
      });
    })
    .catch((error: unknown) => {
      const resolvedError =
        error instanceof Error
          ? error
          : new Error('OpenReplay bootstrap failed');

      faro?.api.pushError(resolvedError);
      console.warn('OpenReplay bootstrap failed', resolvedError);
    });
});
