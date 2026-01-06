/**
 * Basic usage examples for ai-token-chunker
 */

import { chunkPrompt, ProviderNotSupportedError, LimitExceededError } from '../src/index.js';

// Example 1: Simple text chunking
console.log('=== Example 1: Simple Text Chunking ===');
try {
  const longText = 'This is a very long text. '.repeat(10000);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: longText,
  });

  console.log(`Total chunks: ${result.metadata.totalChunks}`);
  console.log(`Estimated tokens: ${result.metadata.estimatedTokens}`);
  console.log(`Estimated bytes: ${result.metadata.estimatedBytes}`);
  console.log(`First chunk length: ${result.chunks[0].text.length} chars`);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n');

// Example 2: Text that fits in one chunk
console.log('=== Example 2: Text That Fits in One Chunk ===');
try {
  const shortText = 'This is a short text that fits in one chunk.';
  const result = chunkPrompt({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    input: shortText,
  });

  console.log(`Total chunks: ${result.metadata.totalChunks}`);
  console.log(`Chunk text: ${result.chunks[0].text}`);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n');

// Example 3: Different providers
console.log('=== Example 3: Different Providers ===');
const providers = [
  { provider: 'openai', model: 'gpt-4o' },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  { provider: 'gemini', model: 'gemini-1.5-pro' },
  { provider: 'mistral', model: 'mistral-large-latest' },
];

const testText = 'Test text. '.repeat(100);

for (const { provider, model } of providers) {
  try {
    const result = chunkPrompt({
      provider,
      model,
      input: testText,
    });
    console.log(`${provider}/${model}: ${result.metadata.totalChunks} chunk(s)`);
  } catch (error) {
    console.error(`${provider}/${model}: ${error.message}`);
  }
}

console.log('\n');

// Example 4: Error handling
console.log('=== Example 4: Error Handling ===');
try {
  chunkPrompt({
    provider: 'invalid-provider',
    model: 'some-model',
    input: 'test',
  });
} catch (error) {
  if (error instanceof ProviderNotSupportedError) {
    console.log(`Caught ProviderNotSupportedError: ${error.message}`);
  }
}

console.log('\n');

// Example 5: Custom limits
console.log('=== Example 5: Custom Limits ===');
try {
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: 'A'.repeat(10000),
    options: {
      customLimits: {
        maxBytes: 1000,
        maxChars: 500,
        maxTokens: 250,
      },
    },
  });
  console.log(`Custom limits: ${result.metadata.totalChunks} chunks`);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n');

// Example 6: Chunking with overlap
console.log('=== Example 6: Chunking with Overlap ===');
try {
  const text = 'Sentence one. Sentence two. Sentence three. '.repeat(100);
  const result = chunkPrompt({
    provider: 'openai',
    model: 'gpt-4o',
    input: text,
    options: {
      chunkOverlap: 50,
    },
  });
  console.log(`Chunks with overlap: ${result.metadata.totalChunks}`);
  if (result.chunks.length > 1) {
    console.log(`First chunk ends with: ...${result.chunks[0].text.slice(-30)}`);
    console.log(`Second chunk starts with: ${result.chunks[1].text.slice(0, 30)}...`);
  }
} catch (error) {
  console.error('Error:', error.message);
}

