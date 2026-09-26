import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEndpoints, renderSummary } from './public-endpoint-check.mjs';

const one = [
  { name: 'Test endpoint', url: 'https://example.test/', type: 'html' },
];
const resolve = async () => ({ address: '127.0.0.1' });

test('accepts resolved HTTPS only with HTTP 200 and the expected content type', async () => {
  const results = await inspectEndpoints({
    list: one,
    resolve,
    request: async () => ({
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    }),
  });
  assert.equal(results[0].result, 'PASS');
  assert.match(renderSummary(results), /PASS/);
});

test('rejects redirects, Cloudflare challenges and server errors', async () => {
  for (const status of [301, 403, 503]) {
    const results = await inspectEndpoints({
      list: one,
      resolve,
      request: async () => ({
        status,
        headers: new Headers({ 'content-type': 'text/html' }),
      }),
    });
    assert.equal(results[0].result, 'FAIL');
    assert.equal(results[0].http, String(status));
  }
});

test('does not request HTTP if DNS cannot resolve', async () => {
  const results = await inspectEndpoints({
    list: one,
    resolve: async () => { throw new Error('DNS lookup failed'); },
    request: async () => { throw new Error('request must not execute'); },
  });
  assert.equal(results[0].dns, 'unresolved');
  assert.equal(results[0].http, 'not checked');
  assert.equal(results[0].result, 'FAIL');
});

test('requires parseable JSON from JSON endpoints', async () => {
  const results = await inspectEndpoints({
    list: [{ ...one[0], type: 'json' }],
    resolve,
    request: async () => ({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => { throw new Error('invalid JSON'); },
    }),
  });
  assert.equal(results[0].result, 'FAIL');
});

test('private endpoints pass on HTTP 401 but reject unexpected HTTP 200', async () => {
  const protectedEndpoint = [
    {
      name: 'Protected',
      url: 'https://example.test/api/projects',
      type: 'json',
      expectedStatus: 401,
    },
  ];
  const deny = await inspectEndpoints({
    list: protectedEndpoint,
    resolve,
    request: async () => ({
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Unauthorized' }),
    }),
  });
  assert.equal(deny[0].result, 'PASS');

  const leak = await inspectEndpoints({
    list: protectedEndpoint,
    resolve,
    request: async () => ({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ projects: [] }),
    }),
  });
  assert.equal(leak[0].result, 'FAIL');
});
