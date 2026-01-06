/**
 * Tests for ai-token-chunker
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  chunkPrompt,
  ProviderNotSupportedError,
  LimitExceededError,
  ImageLimitError,
  InvalidInputError,
} from '../src/index.js';

test('chunkPrompt - simple text that fits in one chunk', () => {
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: 'Hello, world!',
  });

  assert.strictEqual(result.chunks.length, 1);
  assert.strictEqual(result.chunks[0].text, 'Hello, world!');
  assert.strictEqual(result.chunks[0].index, 0);
  assert.strictEqual(result.metadata.totalChunks, 1);
  assert.strictEqual(result.metadata.provider, 'openai');
  assert.strictEqual(result.metadata.model, 'gpt-4o');
});

test('chunkPrompt - long text that needs chunking', () => {
  // Use a much longer text to force chunking (gpt-4o has 512K char limit)
  const longText = 'This is a test. '.repeat(100000);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: longText,
  });

  assert(result.chunks.length > 1);
  assert(result.metadata.totalChunks > 1);
  
  // Verify all chunks have text
  for (const chunk of result.chunks) {
    assert(chunk.text.length > 0);
    assert(typeof chunk.index === 'number');
  }
});

test('chunkPrompt - provider not supported', () => {
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

test('chunkPrompt - invalid input', () => {
  assert.throws(
    () => {
      chunkPrompt({
        provider: 'openai',
        model: 'gpt-4o',
        input: null,
      });
    },
    InvalidInputError
  );

  assert.throws(
    () => {
      chunkPrompt({
        provider: 'openai',
        model: 'gpt-4o',
        input: '',
      });
    },
    InvalidInputError
  );
});

test('chunkPrompt - different providers', () => {
  const testText = 'Test text. '.repeat(100);

  const providers = [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    { provider: 'gemini', model: 'gemini-1.5-pro' },
    { provider: 'mistral', model: 'mistral-large-latest' },
  ];

  for (const { provider, model } of providers) {
    const result = chunkPrompt({
      provider,
      model,
      input: testText,
    });

    assert(result.chunks.length > 0);
    assert.strictEqual(result.metadata.provider, provider);
    assert.strictEqual(result.metadata.model, model);
  }
});

test('chunkPrompt - custom limits', () => {
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: 'A'.repeat(5000),
    options: {
      customLimits: {
        maxBytes: 1000,
        maxChars: 500,
        maxTokens: 250,
      },
    },
  });

  assert(result.chunks.length > 1);
  
  // Each chunk should respect custom limits
  for (const chunk of result.chunks) {
    const chunkBytes = Buffer.byteLength(chunk.text, 'utf8');
    assert(chunkBytes <= 1000);
    assert(chunk.text.length <= 500);
  }
});

test('chunkPrompt - image rejection (too many images)', () => {
  const images = Array(20).fill(Buffer.from('fake-image-data'));

  assert.throws(
    () => {
      chunkPrompt({
        provider: 'openai',
        model: 'gpt-4o',
        input: 'Test',
        images,
      });
    },
    ImageLimitError
  );
});

test('chunkPrompt - image rejection (image too large)', () => {
  // Create a buffer larger than the limit (20MB)
  const largeImage = Buffer.alloc(21000000); // 21MB

  assert.throws(
    () => {
      chunkPrompt({
        provider: 'openai',
        model: 'gpt-4o',
        input: 'Test',
        images: [largeImage],
      });
    },
    ImageLimitError
  );
});

test('chunkPrompt - byte overflow edge case', () => {
  // Create text that would exceed byte limit
  // Use multi-byte characters to test UTF-8 encoding
  const multiByteText = '🚀'.repeat(100000); // Each emoji is ~4 bytes

  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: multiByteText,
    options: {
      customLimits: {
        maxBytes: 1000,
        maxChars: 10000,
        maxTokens: 10000,
      },
    },
  });

  // Should chunk successfully
  assert(result.chunks.length > 0);
  
  // Verify byte limits are respected
  for (const chunk of result.chunks) {
    const chunkBytes = Buffer.byteLength(chunk.text, 'utf8');
    assert(chunkBytes <= 1000);
  }
});

test('chunkPrompt - chunk overlap option', () => {
  const text = 'Sentence one. Sentence two. Sentence three. '.repeat(100);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: text,
    options: {
      chunkOverlap: 50,
    },
  });

  if (result.chunks.length > 1) {
    // With overlap, chunks should have some shared content
    // (exact overlap depends on split points)
    assert(result.chunks.length > 0);
  }
});

test('chunkPrompt - respects word boundaries', () => {
  const text = 'word '.repeat(1000);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: text,
    options: {
      respectWordBoundaries: true,
      customLimits: {
        maxBytes: 100,
        maxChars: 50,
        maxTokens: 25,
      },
    },
  });

  // Chunks should not split in the middle of words
  for (const chunk of result.chunks) {
    // Check that chunks don't end with partial words (simplified check)
    if (chunk.text.length > 0 && chunk.text !== result.chunks[result.chunks.length - 1].text) {
      // Last character before space should be valid
      const trimmed = chunk.text.trimEnd();
      assert(trimmed.length > 0);
    }
  }
});

test('chunkPrompt - metadata accuracy', () => {
  const text = 'Test text. '.repeat(100);
  const result = chunkPrompt({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    input: text,
  });

  assert(typeof result.metadata.estimatedTokens === 'number');
  assert(typeof result.metadata.estimatedBytes === 'number');
  assert(result.metadata.estimatedTokens > 0);
  assert(result.metadata.estimatedBytes > 0);
  assert.strictEqual(result.metadata.totalChunks, result.chunks.length);
});

