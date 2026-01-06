/**
 * Tests for CommonJS compatibility
 */

const { test } = require('node:test');
const assert = require('node:assert');
const {
  chunkPrompt,
  ProviderNotSupportedError,
  LimitExceededError,
  ImageLimitError,
  InvalidInputError,
} = require('../src/index.cjs');

test('CJS - chunkPrompt works', () => {
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: 'Hello, world!',
  });

  assert.strictEqual(result.chunks.length, 1);
  assert.strictEqual(result.chunks[0].text, 'Hello, world!');
  assert.strictEqual(result.metadata.provider, 'openai');
});

test('CJS - error classes work', () => {
  assert.throws(
    () => {
      chunkPrompt({
        provider: 'invalid-provider',
        model: 'some-model',
        input: 'test',
      });
    },
    ProviderNotSupportedError
  );
});

test('CJS - long text chunking', () => {
  const longText = 'This is a test. '.repeat(100000);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: longText,
  });

  assert(result.chunks.length > 1);
});

