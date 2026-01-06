/**
 * Core chunking algorithm
 */

import { estimateTokens, getTextByteSize, checkFits } from './limits.js';
import { getImagesByteSize } from './image.js';
import { InvalidInputError, LimitExceededError } from './errors.js';

/**
 * Find the best split point in text
 * Tries to split at sentence boundaries, then word boundaries, then character boundaries
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length for the chunk
 * @returns {number} Index to split at
 */
function findSplitPoint(text, maxLength) {
  if (maxLength >= text.length) {
    return text.length;
  }

  // Try to split at sentence boundaries (., !, ?)
  const sentenceEnd = Math.min(maxLength, text.length);
  for (let i = sentenceEnd; i > Math.max(0, sentenceEnd - 200); i--) {
    if (/[.!?]\s/.test(text.slice(i - 2, i + 1))) {
      return i;
    }
  }

  // Try to split at word boundaries
  for (let i = sentenceEnd; i > Math.max(0, sentenceEnd - 100); i--) {
    if (/\s/.test(text[i])) {
      return i + 1;
    }
  }

  // Fallback: split at character boundary
  return maxLength;
}

/**
 * Chunk text and images into safe pieces
 * @param {string} text - Input text
 * @param {Array} images - Normalized images
 * @param {Object} limits - Provider limits
 * @param {Object} options - Chunking options
 * @returns {Array} Array of chunks {text, images, index}
 */
export function chunkInput(text, images, limits, options = {}) {
  const {
    chunkOverlap = 0, // Characters to overlap between chunks
    respectWordBoundaries = true,
  } = options;

  if (!text || typeof text !== 'string') {
    throw new InvalidInputError('Text input is required and must be a string');
  }

  const chunks = [];
  const imageBytes = getImagesByteSize(images);

  // If images exist, we need to account for them in each chunk
  // For simplicity, we'll attach all images to the first chunk
  // and ensure subsequent chunks don't exceed limits without images
  const availableBytesForText = limits.maxBytes - imageBytes;
  const availableCharsForText = Math.min(
    limits.maxChars,
    Math.floor(availableBytesForText / 2) // Rough estimate: 2 bytes per char
  );

  // Check if even a single character would exceed limits (unsplittable chunk)
  // This prevents infinite loops and provides clear error messages
  const singleCharBytes = getTextByteSize('A'); // Test with a single character
  const singleCharWithImages = singleCharBytes + imageBytes;
  if (singleCharWithImages > limits.maxBytes) {
    throw new LimitExceededError({
      provider: options.provider,
      model: options.model,
      limit: 'maxBytes',
      actual: singleCharWithImages,
      allowed: limits.maxBytes,
    });
  }
  if (1 > limits.maxChars) {
    throw new LimitExceededError({
      provider: options.provider,
      model: options.model,
      limit: 'maxChars',
      actual: 1,
      allowed: limits.maxChars,
    });
  }

  let currentIndex = 0;
  let chunkIndex = 0;

  while (currentIndex < text.length) {
    // Check if remaining text exceeds limits and cannot be split
    const remainingText = text.slice(currentIndex);
    const remainingBytes = getTextByteSize(remainingText);
    const remainingBytesWithImages = remainingBytes + (chunkIndex === 0 ? imageBytes : 0);
    
    // If remaining text exceeds limits and we can't split it further, throw error
    if (remainingBytesWithImages > limits.maxBytes && remainingText.length <= 1) {
      throw new LimitExceededError({
        provider: options.provider,
        model: options.model,
        limit: 'maxBytes',
        actual: remainingBytesWithImages,
        allowed: limits.maxBytes,
      });
    }
    if (remainingText.length > limits.maxChars && remainingText.length <= 1) {
      throw new LimitExceededError({
        provider: options.provider,
        model: options.model,
        limit: 'maxChars',
        actual: remainingText.length,
        allowed: limits.maxChars,
      });
    }
    
    // Determine max chunk size
    // First chunk can include images, subsequent chunks cannot
    const isFirstChunk = chunkIndex === 0;
    const maxChunkBytes = isFirstChunk
      ? availableBytesForText
      : limits.maxBytes;
    const maxChunkChars = isFirstChunk
      ? availableCharsForText
      : limits.maxChars;

    // Estimate how much text we can fit
    // Use conservative estimate: assume 2 bytes per character
    const estimatedMaxChars = Math.floor(maxChunkBytes / 2);
    const targetChars = Math.min(maxChunkChars, estimatedMaxChars);

    // Find where to split
    let splitPoint;

    if (remainingText.length <= targetChars) {
      // Entire remaining text fits
      splitPoint = remainingText.length;
    } else {
      // Need to split
      if (respectWordBoundaries) {
        splitPoint = findSplitPoint(remainingText, targetChars);
      } else {
        splitPoint = targetChars;
      }
    }

    // Extract chunk text
    let chunkText = remainingText.slice(0, splitPoint);

    // Enforce "Single Unit Overflow" failure - detect unsplittable chunks immediately
    // This check must run before binary search begins
    const chunkBytes = getTextByteSize(chunkText);
    
    if (
      chunkText.length > limits.maxChars ||
      chunkBytes > maxChunkBytes
    ) {
      throw new LimitExceededError({
        provider: options.provider,
        model: options.model,
        limit: chunkBytes > maxChunkBytes ? 'maxBytes' : 'maxChars',
        actual: Math.max(chunkText.length, chunkBytes),
        allowed: Math.min(limits.maxChars, maxChunkBytes),
      });
    }

    // Verify chunk fits (with safety margin)
    // Re-check with actual byte size
    const chunkImageBytes = isFirstChunk ? imageBytes : 0;
    const totalChunkBytes = chunkBytes + chunkImageBytes;

    // Verify chunk fits (with safety margin)
    // Re-check with actual byte size

    // If it doesn't fit, reduce size
    if (totalChunkBytes > maxChunkBytes) {
      // Binary search for safe size
      let low = 0;
      let high = chunkText.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const testText = chunkText.slice(0, mid);
        const testBytes = getTextByteSize(testText) + chunkImageBytes;
        if (testBytes <= maxChunkBytes) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      splitPoint = Math.max(0, low - 1);
      chunkText = remainingText.slice(0, splitPoint);
    }

    // Verify token estimate
    const estimatedTokens = estimateTokens(chunkText);
    if (estimatedTokens > limits.maxTokens) {
      // Reduce further based on token estimate
      const maxCharsByTokens = limits.maxTokens * 4; // 4 chars per token
      if (chunkText.length > maxCharsByTokens) {
        splitPoint = Math.min(splitPoint, maxCharsByTokens);
        chunkText = remainingText.slice(0, splitPoint);
      }
    }

    // Create chunk
    const chunk = {
      text: chunkText,
      images: isFirstChunk ? images : [],
      index: chunkIndex,
    };

    chunks.push(chunk);

    // Move to next chunk
    currentIndex += splitPoint;

    // Handle overlap
    if (chunkOverlap > 0 && currentIndex < text.length) {
      currentIndex = Math.max(0, currentIndex - chunkOverlap);
    }

    chunkIndex++;

    // Safety: prevent infinite loops
    // This should not happen if the pre-check above works, but keep as fallback
    if (splitPoint === 0) {
      throw new LimitExceededError({
        provider: options.provider,
        model: options.model,
        limit: 'maxBytes',
        actual: totalChunkBytes,
        allowed: maxChunkBytes,
      });
    }
  }

  return chunks;
}

/**
 * Calculate metadata for chunks
 * @param {Array} chunks - Array of chunks
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {Object} Metadata
 */
export function calculateMetadata(chunks, provider, model) {
  let totalEstimatedTokens = 0;
  let totalEstimatedBytes = 0;

  for (const chunk of chunks) {
    totalEstimatedTokens += estimateTokens(chunk.text);
    totalEstimatedBytes += getTextByteSize(chunk.text);
    totalEstimatedBytes += getImagesByteSize(chunk.images);
  }

  return {
    provider,
    model,
    totalChunks: chunks.length,
    estimatedTokens: totalEstimatedTokens,
    estimatedBytes: totalEstimatedBytes,
  };
}

