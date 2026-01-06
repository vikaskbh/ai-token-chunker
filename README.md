# ai-token-chunker

> Safely split prompts across multiple AI providers without breaking token or byte limits

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A **boring, reliable, zero-magic** npm package that preflights and chunks inputs safely before sending them to AI providers. No network calls, no tokenizers bundled, just deterministic chunking based on provider limits.

## 🧠 Why This Exists

Different AI providers enforce different limits:

- **Tokens** (varies by model)
- **Characters** (some providers use character limits)
- **Bytes** (UTF-8 encoding matters)
- **Image payload size** (per image and total)
- **Message structure constraints**

Developers routinely hit:
- `context_length_exceeded` errors
- Silent truncation
- Partial image loss
- Unpredictable failures

This library **preflights and chunks inputs safely** before you hit the API.

## 📦 Features

- ✅ **Zero runtime dependencies**
- ✅ Works in Node 18+
- ✅ ESM first, CommonJS supported
- ✅ Deterministic output
- ✅ No network calls
- ✅ No tokenizers bundled (approximation only)
- ✅ Supports 10+ providers with default limits
- ✅ Image validation and handling
- ✅ Custom limit overrides
- ✅ Developer-friendly error messages

## 🚀 Installation

```bash
npm install ai-token-chunker
```

## 📖 Usage

### Basic Example

```javascript
import { chunkPrompt } from 'ai-token-chunker';

const result = chunkPrompt({
  provider: 'openai',
  model: 'gpt-4o',
  input: 'Your very long text here...',
});

console.log(`Total chunks: ${result.metadata.totalChunks}`);
console.log(`Estimated tokens: ${result.metadata.estimatedTokens}`);

for (const chunk of result.chunks) {
  // Send each chunk to your AI provider
  console.log(`Chunk ${chunk.index}: ${chunk.text.slice(0, 50)}...`);
}
```

### With Images

```javascript
import { chunkPrompt } from 'ai-token-chunker';
import fs from 'fs';

const imageBuffer = fs.readFileSync('image.png');

const result = chunkPrompt({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  input: 'Describe this image...',
  images: [imageBuffer], // Buffer, base64 string, or {buffer, mime}
});
```

### Custom Limits

```javascript
const result = chunkPrompt({
  provider: 'openai',
  model: 'gpt-4o',
  input: 'Long text...',
  options: {
    customLimits: {
      maxBytes: 1000,
      maxChars: 500,
      maxTokens: 250,
    },
  },
});
```

### Chunk Overlap

```javascript
const result = chunkPrompt({
  provider: 'openai',
  model: 'gpt-4o',
  input: 'Long text...',
  options: {
    chunkOverlap: 100, // Overlap 100 characters between chunks
  },
});
```

## 🧩 API Reference

### `chunkPrompt(params)`

Main function to chunk prompts.

**Parameters:**

- `provider` (string, required): Provider name (e.g., `'openai'`, `'anthropic'`, `'gemini'`)
- `model` (string, required): Model name (e.g., `'gpt-4o'`, `'claude-3-5-sonnet-20241022'`)
- `input` (string, required): Input text to chunk
- `images` (Array, optional): Array of images as:
  - `Buffer`
  - Base64 string
  - `{buffer: Buffer, mime: string}`
- `options` (Object, optional):
  - `chunkOverlap` (number): Characters to overlap between chunks (default: 0)
  - `respectWordBoundaries` (boolean): Try to split at word boundaries (default: true)
  - `customLimits` (Object): Override provider limits

**Returns:**

```javascript
{
  chunks: [
    {
      text: string,
      images: Array,
      index: number
    }
  ],
  metadata: {
    provider: string,
    model: string,
    totalChunks: number,
    estimatedTokens: number,
    estimatedBytes: number
  }
}
```

**Throws:**

- `ProviderNotSupportedError`: Provider not in supported list
- `LimitExceededError`: Input exceeds limits (when not chunking)
- `ImageLimitError`: Images exceed limits
- `InvalidInputError`: Invalid input parameters

## 🏢 Supported Providers

Default limits are configured for:

| Provider | Models | Max Tokens | Max Images |
|----------|--------|------------|------------|
| **OpenAI** | gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo | 128K (gpt-4o) | 10 |
| **Anthropic** | claude-3-5-sonnet, claude-3-opus, claude-3-sonnet, claude-3-haiku | 200K | 20 |
| **Google Gemini** | gemini-1.5-pro, gemini-1.5-flash, gemini-pro | 2M (1.5-pro) | 16 |
| **Mistral** | mistral-large-latest, mistral-medium-latest, mistral-small-latest | 128K | 0 |
| **Cohere** | command-r-plus, command-r | 128K | 0 |
| **Groq** | llama-3.1-70b, llama-3.1-8b, mixtral-8x7b | 131K | 0 |
| **Azure OpenAI** | Same as OpenAI | 128K | 10 |
| **AWS Bedrock** | Various (Claude, Llama, etc.) | Varies | Varies |
| **Together AI** | Various | 8K | 0 |
| **Ollama** | llama3, mistral, etc. | 8K | 0 |

> **Note:** Limits are conservative estimates based on public documentation. Use `customLimits` to override for your specific use case.

## 🧮 Token Estimation

This library uses **heuristics, not exact tokenizers**:

- Default: **1 token ≈ 4 characters**
- Images counted separately
- **Byte limit always wins** over token limit

### Why Approximations?

Exact tokenization requires:
- Provider-specific tokenizers (different for each provider)
- Large dependency bundles
- Network calls or local models

This library prioritizes:
- ✅ Zero dependencies
- ✅ Fast, deterministic chunking
- ✅ Works offline
- ✅ Safety margin built-in

**Important:** This is a **safety layer, not a tokenizer**. For exact token counts, use provider-specific tokenizers (e.g., `tiktoken` for OpenAI).

## 🖼 Image Handling

Images are accepted as:
- `Buffer` objects
- Base64 strings
- `{buffer: Buffer, mime: string}` objects

The library validates:
- ✅ Maximum image count per provider
- ✅ Per-image byte size limits
- ✅ Total payload size

**If an image exceeds limits:**
- ❌ Throws a descriptive error
- ❌ Does NOT auto-resize
- ❌ Does NOT auto-compress

You must handle image preprocessing before chunking.

## 🚨 Error Handling

All errors include context:

```javascript
import {
  chunkPrompt,
  ProviderNotSupportedError,
  LimitExceededError,
  ImageLimitError,
  InvalidInputError,
} from 'ai-token-chunker';

try {
  const result = chunkPrompt({ /* ... */ });
} catch (error) {
  if (error instanceof ProviderNotSupportedError) {
    console.error(`Provider not supported: ${error.provider}`);
  } else if (error instanceof LimitExceededError) {
    console.error(`Limit exceeded: ${error.limit}`);
    console.error(`Actual: ${error.actual}, Allowed: ${error.allowed}`);
  } else if (error instanceof ImageLimitError) {
    console.error(`Image error: ${error.reason}`);
    console.error(`Image index: ${error.imageIndex}`);
  }
}
```

## 🧪 Testing

```bash
npm test
```

## 📚 Examples

See `examples/basic.js` for more usage examples.

## 🎯 Design Philosophy

- **Predictable > clever**: Deterministic chunking, no magic
- **Explicit limits > magic**: You control the limits
- **Fail early**: Errors before API calls
- **Developer-friendly**: Clear error messages with context
- **Suitable for backend pipelines**: FastAPI, Node, Edge functions

## ⚠️ Common Failure Scenarios

### 1. Silent Truncation

**Problem:** Provider silently truncates your input.

**Solution:** Chunk before sending:

```javascript
const result = chunkPrompt({ provider, model, input });
// Send each chunk separately
```

### 2. Multi-byte Characters

**Problem:** UTF-8 encoding means character count ≠ byte count.

**Solution:** This library uses byte limits, not just character limits.

### 3. Image Payload Too Large

**Problem:** Single image exceeds provider limit.

**Solution:** Preprocess images before chunking:

```javascript
// Resize/compress images first
const processedImage = await resizeImage(originalImage);
const result = chunkPrompt({ provider, model, input, images: [processedImage] });
```

### 4. Token Count Mismatch

**Problem:** Estimated tokens don't match provider's count.

**Solution:** This is expected. Use provider-specific tokenizers for exact counts, but this library provides a safety margin.

## 🔧 Advanced Usage

### Access Provider Limits

```javascript
import { getProviderLimits } from 'ai-token-chunker';

const limits = getProviderLimits('openai', 'gpt-4o');
console.log(limits);
// {
//   maxTokens: 128000,
//   maxChars: 512000,
//   maxBytes: 512000,
//   maxImages: 10,
//   imageByteLimit: 20000000
// }
```

### Estimate Tokens

```javascript
import { estimateTokens } from 'ai-token-chunker';

const tokens = estimateTokens('Hello, world!');
console.log(tokens); // ~3 tokens
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please ensure:
- Zero runtime dependencies
- Node 18+ compatibility
- Tests pass
- Documentation updated

## ⚡ Performance

- **Fast**: No network calls, no heavy dependencies
- **Deterministic**: Same input = same output
- **Memory efficient**: Streams-friendly chunking

## 🎓 When to Use This Library

✅ **Use when:**
- You need to chunk prompts before sending to AI providers
- You want safety margins built-in
- You need zero dependencies
- You work with multiple providers

❌ **Don't use when:**
- You need exact token counts (use provider tokenizers)
- You need automatic image resizing
- You need network-based tokenization

---

**Remember:** This is a **safety layer, not a tokenizer**. It prevents you from hitting limits, but doesn't provide exact token counts.

