/**
 * Core chunking algorithm (CommonJS)
 */

const { estimateTokens, getTextByteSize, checkFits } = require('./limits.cjs');
const { getImagesByteSize } = require('./image.cjs');
const { InvalidInputError } = require('./errors.cjs');

function findSplitPoint(text, maxLength) {
  if (maxLength >= text.length) {
    return text.length;
  }

  const sentenceEnd = Math.min(maxLength, text.length);
  for (let i = sentenceEnd; i > Math.max(0, sentenceEnd - 200); i--) {
    if (/[.!?]\s/.test(text.slice(i - 2, i + 1))) {
      return i;
    }
  }

  for (let i = sentenceEnd; i > Math.max(0, sentenceEnd - 100); i--) {
    if (/\s/.test(text[i])) {
      return i + 1;
    }
  }

  return maxLength;
}

function chunkInput(text, images, limits, options = {}) {
  const {
    chunkOverlap = 0,
    respectWordBoundaries = true,
  } = options;

  if (!text || typeof text !== 'string') {
    throw new InvalidInputError('Text input is required and must be a string');
  }

  const chunks = [];
  const imageBytes = getImagesByteSize(images);

  const availableBytesForText = limits.maxBytes - imageBytes;
  const availableCharsForText = Math.min(
    limits.maxChars,
    Math.floor(availableBytesForText / 2)
  );

  let currentIndex = 0;
  let chunkIndex = 0;

  while (currentIndex < text.length) {
    const isFirstChunk = chunkIndex === 0;
    const maxChunkBytes = isFirstChunk
      ? availableBytesForText
      : limits.maxBytes;
    const maxChunkChars = isFirstChunk
      ? availableCharsForText
      : limits.maxChars;

    const estimatedMaxChars = Math.floor(maxChunkBytes / 2);
    const targetChars = Math.min(maxChunkChars, estimatedMaxChars);

    const remainingText = text.slice(currentIndex);
    let splitPoint;

    if (remainingText.length <= targetChars) {
      splitPoint = remainingText.length;
    } else {
      if (respectWordBoundaries) {
        splitPoint = findSplitPoint(remainingText, targetChars);
      } else {
        splitPoint = targetChars;
      }
    }

    let chunkText = remainingText.slice(0, splitPoint);

    const chunkBytes = getTextByteSize(chunkText);
    const chunkImageBytes = isFirstChunk ? imageBytes : 0;
    const totalChunkBytes = chunkBytes + chunkImageBytes;

    if (totalChunkBytes > maxChunkBytes) {
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

    const estimatedTokens = estimateTokens(chunkText);
    if (estimatedTokens > limits.maxTokens) {
      const maxCharsByTokens = limits.maxTokens * 4;
      if (chunkText.length > maxCharsByTokens) {
        splitPoint = Math.min(splitPoint, maxCharsByTokens);
        chunkText = remainingText.slice(0, splitPoint);
      }
    }

    const chunk = {
      text: chunkText,
      images: isFirstChunk ? images : [],
      index: chunkIndex,
    };

    chunks.push(chunk);

    currentIndex += splitPoint;

    if (chunkOverlap > 0 && currentIndex < text.length) {
      currentIndex = Math.max(0, currentIndex - chunkOverlap);
    }

    chunkIndex++;

    if (splitPoint === 0) {
      throw new InvalidInputError(
        'Unable to chunk input: single character exceeds limits',
        { provider: options.provider, model: options.model }
      );
    }
  }

  return chunks;
}

function calculateMetadata(chunks, provider, model) {
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

module.exports = {
  chunkInput,
  calculateMetadata,
};

