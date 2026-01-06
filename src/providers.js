/**
 * Provider definitions with limits for various AI providers
 */

/**
 * Default provider limits
 * All limits are conservative estimates based on public documentation
 */
export const PROVIDER_LIMITS = {
  // OpenAI
  openai: {
    'gpt-4o': {
      maxTokens: 128000,
      maxChars: 512000, // ~4 chars per token
      maxBytes: 512000,
      maxImages: 10,
      imageByteLimit: 20000000, // 20MB per image
    },
    'gpt-4-turbo': {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 10,
      imageByteLimit: 20000000,
    },
    'gpt-4': {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'gpt-3.5-turbo': {
      maxTokens: 16385,
      maxChars: 65540,
      maxBytes: 65540,
      maxImages: 0,
      imageByteLimit: 0,
    },
    // Default fallback
    default: {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 10,
      imageByteLimit: 20000000,
    },
  },

  // Google Gemini
  gemini: {
    'gemini-1.5-pro': {
      maxTokens: 2097152,
      maxChars: 8388608,
      maxBytes: 8388608,
      maxImages: 16,
      imageByteLimit: 20000000,
    },
    'gemini-1.5-flash': {
      maxTokens: 1048576,
      maxChars: 4194304,
      maxBytes: 4194304,
      maxImages: 16,
      imageByteLimit: 20000000,
    },
    'gemini-pro': {
      maxTokens: 32768,
      maxChars: 131072,
      maxBytes: 131072,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 2097152,
      maxChars: 8388608,
      maxBytes: 8388608,
      maxImages: 16,
      imageByteLimit: 20000000,
    },
  },

  // Anthropic Claude
  anthropic: {
    'claude-3-5-sonnet-20241022': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000, // 5MB per image
    },
    'claude-3-opus-20240229': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
    'claude-3-sonnet-20240229': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
    'claude-3-haiku-20240307': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
    default: {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
  },

  // Mistral
  mistral: {
    'mistral-large-latest': {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'mistral-medium-latest': {
      maxTokens: 32000,
      maxChars: 128000,
      maxBytes: 128000,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'mistral-small-latest': {
      maxTokens: 32000,
      maxChars: 128000,
      maxBytes: 128000,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 0,
      imageByteLimit: 0,
    },
  },

  // Cohere
  cohere: {
    'command-r-plus': {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'command-r': {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 0,
      imageByteLimit: 0,
    },
  },

  // Groq
  groq: {
    'llama-3.1-70b-versatile': {
      maxTokens: 131072,
      maxChars: 524288,
      maxBytes: 524288,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'llama-3.1-8b-instant': {
      maxTokens: 131072,
      maxChars: 524288,
      maxBytes: 524288,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'mixtral-8x7b-32768': {
      maxTokens: 32768,
      maxChars: 131072,
      maxBytes: 131072,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 131072,
      maxChars: 524288,
      maxBytes: 524288,
      maxImages: 0,
      imageByteLimit: 0,
    },
  },

  // Azure OpenAI (same as OpenAI)
  'azure-openai': {
    default: {
      maxTokens: 128000,
      maxChars: 512000,
      maxBytes: 512000,
      maxImages: 10,
      imageByteLimit: 20000000,
    },
  },

  // AWS Bedrock (varies by model, using common defaults)
  bedrock: {
    'anthropic.claude-3-5-sonnet-20241022-v2:0': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
    'anthropic.claude-3-opus-20240229-v1:0': {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
    'meta.llama3-1-405b-instruct-v1:0': {
      maxTokens: 131072,
      maxChars: 524288,
      maxBytes: 524288,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 200000,
      maxChars: 800000,
      maxBytes: 800000,
      maxImages: 20,
      imageByteLimit: 5000000,
    },
  },

  // Together AI
  together: {
    'meta-llama/Llama-3-70b-chat-hf': {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
  },

  // Ollama (local, conservative defaults)
  ollama: {
    'llama3': {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
    'mistral': {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
    default: {
      maxTokens: 8192,
      maxChars: 32768,
      maxBytes: 32768,
      maxImages: 0,
      imageByteLimit: 0,
    },
  },
};

/**
 * Get limits for a provider and model
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {Object} Limit configuration
 */
export function getProviderLimits(provider, model) {
  const providerConfig = PROVIDER_LIMITS[provider];
  if (!providerConfig) {
    return null;
  }

  // Try exact model match first, then fallback to default
  return providerConfig[model] || providerConfig.default || null;
}

