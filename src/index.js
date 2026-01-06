/**
 * Main entry point for ai-token-chunker
 */

import { ProviderNotSupportedError, InvalidInputError } from './errors.js';
import { getProviderLimits } from './providers.js';
import { validateImages } from './image.js';
import { validateLimits } from './limits.js';
import { chunkInput, calculateMetadata } from './chunker.js';

/**
 * Chunk a prompt for a specific AI provider
 * @param {Object} params - Chunking parameters
 * @param {string} params.provider - Provider name (e.g., 'openai', 'anthropic')
 * @param {string} params.model - Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022')
 * @param {string} params.input - Input text to chunk
 * @param {Array} [params.images] - Optional array of images (Buffer, base64, or {buffer, mime})
 * @param {Object} [params.options] - Optional chunking options
 * @param {number} [params.options.chunkOverlap] - Characters to overlap between chunks (default: 0)
 * @param {boolean} [params.options.respectWordBoundaries] - Try to split at word boundaries (default: true)
 * @param {Object} [params.options.customLimits] - Override provider limits
 * @returns {Object} Chunking result with chunks and metadata
 * @throws {ProviderNotSupportedError} If provider is not supported
 * @throws {InvalidInputError} If input is invalid
 * @throws {LimitExceededError} If input exceeds limits (when not chunking)
 * @throws {ImageLimitError} If images exceed limits
 */
export function chunkPrompt({ provider, model, input, images, options = {} }) {
  // Validate provider
  if (!provider || typeof provider !== 'string') {
    throw new InvalidInputError('Provider is required and must be a string');
  }

  if (!model || typeof model !== 'string') {
    throw new InvalidInputError('Model is required and must be a string');
  }

  if (!input || typeof input !== 'string') {
    throw new InvalidInputError('Input is required and must be a string');
  }

  // Get provider limits
  let limits = getProviderLimits(provider, model);
  if (!limits) {
    throw new ProviderNotSupportedError(provider);
  }

  // Allow custom limits override
  if (options.customLimits) {
    limits = { ...limits, ...options.customLimits };
  }

  // Normalize and validate images
  const normalizedImages = images ? validateImages(images, limits, provider, model) : [];

  // If input is small enough, validate and return single chunk
  // Otherwise, chunk it
  const textBytes = Buffer.byteLength(input, 'utf8');
  const imageBytes = normalizedImages.reduce((sum, img) => sum + img.size, 0);
  const totalBytes = textBytes + imageBytes;
  const estimatedTokens = Math.ceil(input.length / 4);

  // Check if it fits in a single chunk
  const fitsInOneChunk =
    totalBytes <= limits.maxBytes &&
    input.length <= limits.maxChars &&
    estimatedTokens <= limits.maxTokens &&
    normalizedImages.length <= limits.maxImages;

  if (fitsInOneChunk) {
    // Validate limits (will throw if exceeded)
    validateLimits(input, normalizedImages, limits, provider, model);

    const chunks = [
      {
        text: input,
        images: normalizedImages,
        index: 0,
      },
    ];

    return {
      chunks,
      metadata: calculateMetadata(chunks, provider, model),
    };
  }

  // Before chunking, verify that chunking is possible
  // If the input is so large that even after chunking it would exceed limits,
  // we should detect this. However, since we can always split text, this check
  // is mainly for the unsplittable case (single character exceeding limits).
  // The chunkInput function will handle this internally.
  
  // Need to chunk
  const chunks = chunkInput(input, normalizedImages, limits, {
    ...options,
    provider,
    model,
  });

  return {
    chunks,
    metadata: calculateMetadata(chunks, provider, model),
  };
}

// Export error classes for user convenience
export {
  ProviderNotSupportedError,
  LimitExceededError,
  ImageLimitError,
  InvalidInputError,
} from './errors.js';

// Export provider utilities
export { PROVIDER_LIMITS, getProviderLimits } from './providers.js';

// Export limit utilities
export { estimateTokens, getTextByteSize } from './limits.js';

// Export image utilities
export { normalizeImage, validateImages } from './image.js';

