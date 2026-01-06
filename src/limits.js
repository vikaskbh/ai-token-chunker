/**
 * Limit validation and checking utilities
 */

import { LimitExceededError } from './errors.js';
import { getImagesByteSize } from './image.js';

/**
 * Estimate token count from text
 * Uses heuristic: 1 token ≈ 4 characters
 * @param {string} text - Input text
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  // Conservative estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Calculate byte size of text (UTF-8 encoding)
 * @param {string} text - Input text
 * @returns {number} Byte size
 */
export function getTextByteSize(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return Buffer.byteLength(text, 'utf8');
}

/**
 * Validate input against provider limits
 * @param {string} text - Input text
 * @param {Array} images - Normalized images
 * @param {Object} limits - Provider limits
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @throws {LimitExceededError} If any limit is exceeded
 */
export function validateLimits(text, images, limits, provider, model) {
  const textBytes = getTextByteSize(text);
  const imageBytes = getImagesByteSize(images);
  const totalBytes = textBytes + imageBytes;
  const estimatedTokens = estimateTokens(text);

  // Byte limit always wins (most restrictive)
  if (totalBytes > limits.maxBytes) {
    throw new LimitExceededError({
      provider,
      model,
      limit: 'maxBytes',
      actual: totalBytes,
      allowed: limits.maxBytes,
    });
  }

  // Check character limit
  if (text.length > limits.maxChars) {
    throw new LimitExceededError({
      provider,
      model,
      limit: 'maxChars',
      actual: text.length,
      allowed: limits.maxChars,
    });
  }

  // Check token limit (heuristic)
  if (estimatedTokens > limits.maxTokens) {
    throw new LimitExceededError({
      provider,
      model,
      limit: 'maxTokens',
      actual: estimatedTokens,
      allowed: limits.maxTokens,
    });
  }
}

/**
 * Check if input fits within limits (without throwing)
 * @param {string} text - Input text
 * @param {Array} images - Normalized images
 * @param {Object} limits - Provider limits
 * @returns {Object} {fits: boolean, reason?: string, details?: Object}
 */
export function checkFits(text, images, limits) {
  const textBytes = getTextByteSize(text);
  const imageBytes = getImagesByteSize(images);
  const totalBytes = textBytes + imageBytes;
  const estimatedTokens = estimateTokens(text);

  if (totalBytes > limits.maxBytes) {
    return {
      fits: false,
      reason: 'maxBytes',
      details: {
        actual: totalBytes,
        allowed: limits.maxBytes,
      },
    };
  }

  if (text.length > limits.maxChars) {
    return {
      fits: false,
      reason: 'maxChars',
      details: {
        actual: text.length,
        allowed: limits.maxChars,
      },
    };
  }

  if (estimatedTokens > limits.maxTokens) {
    return {
      fits: false,
      reason: 'maxTokens',
      details: {
        actual: estimatedTokens,
        allowed: limits.maxTokens,
      },
    };
  }

  return { fits: true };
}

