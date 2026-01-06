/**
 * Custom error classes for ai-token-chunker (CommonJS)
 */

class ProviderNotSupportedError extends Error {
  constructor(provider) {
    super(`Provider "${provider}" is not supported`);
    this.name = 'ProviderNotSupportedError';
    this.code = 'PROVIDER_NOT_SUPPORTED';
    this.provider = provider;
  }
}

class LimitExceededError extends Error {
  constructor({ provider, model, limit, actual, allowed }) {
    super(
      `Limit exceeded for ${provider}/${model}: ${limit} (actual: ${actual}, allowed: ${allowed})`
    );
    this.name = 'LimitExceededError';
    this.code = 'LIMIT_EXCEEDED';
    this.provider = provider;
    this.model = model;
    this.limit = limit;
    this.actual = actual;
    this.allowed = allowed;
  }
}

class ImageLimitError extends Error {
  constructor({ provider, model, reason, actual, allowed, imageIndex }) {
    super(
      `Image limit error for ${provider}/${model}: ${reason} (actual: ${actual}, allowed: ${allowed}${imageIndex !== undefined ? `, image index: ${imageIndex}` : ''})`
    );
    this.name = 'ImageLimitError';
    this.code = 'IMAGE_LIMIT_EXCEEDED';
    this.provider = provider;
    this.model = model;
    this.reason = reason;
    this.actual = actual;
    this.allowed = allowed;
    this.imageIndex = imageIndex;
  }
}

class InvalidInputError extends Error {
  constructor(message, { provider, model } = {}) {
    super(message);
    this.name = 'InvalidInputError';
    this.code = 'INVALID_INPUT';
    this.provider = provider;
    this.model = model;
  }
}

module.exports = {
  ProviderNotSupportedError,
  LimitExceededError,
  ImageLimitError,
  InvalidInputError,
};

