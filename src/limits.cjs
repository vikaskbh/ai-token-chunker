/**
 * Limit validation and checking utilities (CommonJS)
 */

const { LimitExceededError } = require('./errors.cjs');
const { getImagesByteSize } = require('./image.cjs');

function estimateTokens(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

function getTextByteSize(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return Buffer.byteLength(text, 'utf8');
}

function validateLimits(text, images, limits, provider, model) {
  const textBytes = getTextByteSize(text);
  const imageBytes = getImagesByteSize(images);
  const totalBytes = textBytes + imageBytes;
  const estimatedTokens = estimateTokens(text);

  if (totalBytes > limits.maxBytes) {
    throw new LimitExceededError({
      provider,
      model,
      limit: 'maxBytes',
      actual: totalBytes,
      allowed: limits.maxBytes,
    });
  }

  if (text.length > limits.maxChars) {
    throw new LimitExceededError({
      provider,
      model,
      limit: 'maxChars',
      actual: text.length,
      allowed: limits.maxChars,
    });
  }

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

function checkFits(text, images, limits) {
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

module.exports = {
  estimateTokens,
  getTextByteSize,
  validateLimits,
  checkFits,
};

