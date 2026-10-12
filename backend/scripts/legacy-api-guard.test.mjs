import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { assertLegacyExpressApiEnabled } = require('../dist/config/legacy-api.js');

test('denies startup when NODE_ENV is unset, even if the enable flag is present', () => {
  assert.throws(
    () => assertLegacyExpressApiEnabled({ ENABLE_LEGACY_EXPRESS_API: 'true' }),
    /disabled by default/
  );
});

test('denies startup in production even when explicitly enabled', () => {
  assert.throws(
    () => assertLegacyExpressApiEnabled({
      NODE_ENV: 'production',
      ENABLE_LEGACY_EXPRESS_API: 'true',
    }),
    /disabled by default/
  );
});

test('denies startup in development unless explicitly enabled', () => {
  assert.throws(
    () => assertLegacyExpressApiEnabled({ NODE_ENV: 'development' }),
    /disabled by default/
  );
});

test('allows startup only when explicitly enabled in development', () => {
  assert.doesNotThrow(() => assertLegacyExpressApiEnabled({
    NODE_ENV: 'development',
    ENABLE_LEGACY_EXPRESS_API: 'true',
  }));
});
