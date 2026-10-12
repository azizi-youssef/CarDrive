export function assertLegacyExpressApiEnabled(
  environment: Pick<NodeJS.ProcessEnv, 'NODE_ENV' | 'ENABLE_LEGACY_EXPRESS_API'>
): void {
  if (
    environment.NODE_ENV !== 'development' ||
    environment.ENABLE_LEGACY_EXPRESS_API !== 'true'
  ) {
    throw new Error(
      'The legacy Express API is disabled by default. Enable it only for local development; serve requests through the Next.js BFF.'
    );
  }
}
