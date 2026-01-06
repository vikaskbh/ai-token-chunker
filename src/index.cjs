/**
 * CommonJS entry point for ai-token-chunker
 */

const { ProviderNotSupportedError, InvalidInputError } = require('./errors.cjs');
const { getProviderLimits } = require('./providers.cjs');
const { validateImages } = require('./image.cjs');
const { validateLimits } = require('./limits.cjs');
const { chunkInput, calculateMetadata } = require('./chunker.cjs');

function chunkPrompt({ provider, model, input, images, options = {} }) {
  if (!provider || typeof provider !== 'string') {
    throw new InvalidInputError('Provider is required and must be a string');
  }

  if (!model || typeof model !== 'string') {
    throw new InvalidInputError('Model is required and must be a string');
  }

  if (!input || typeof input !== 'string') {
    throw new InvalidInputError('Input is required and must be a string');
  }

  let limits = getProviderLimits(provider, model);
  if (!limits) {
    throw new ProviderNotSupportedError(provider);
  }

  if (options.customLimits) {
    limits = { ...limits, ...options.customLimits };
  }

  const normalizedImages = images ? validateImages(images, limits, provider, model) : [];

  const textBytes = Buffer.byteLength(input, 'utf8');
  const imageBytes = normalizedImages.reduce((sum, img) => sum + img.size, 0);
  const totalBytes = textBytes + imageBytes;
  const estimatedTokens = Math.ceil(input.length / 4);

  const fitsInOneChunk =
    totalBytes <= limits.maxBytes &&
    input.length <= limits.maxChars &&
    estimatedTokens <= limits.maxTokens &&
    normalizedImages.length <= limits.maxImages;

  if (fitsInOneChunk) {
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

module.exports = {
  chunkPrompt,
  ProviderNotSupportedError: require('./errors.cjs').ProviderNotSupportedError,
  LimitExceededError: require('./errors.cjs').LimitExceededError,
  ImageLimitError: require('./errors.cjs').ImageLimitError,
  InvalidInputError: require('./errors.cjs').InvalidInputError,
  PROVIDER_LIMITS: require('./providers.cjs').PROVIDER_LIMITS,
  getProviderLimits: require('./providers.cjs').getProviderLimits,
  estimateTokens: require('./limits.cjs').estimateTokens,
  getTextByteSize: require('./limits.cjs').getTextByteSize,
  normalizeImage: require('./image.cjs').normalizeImage,
  validateImages: require('./image.cjs').validateImages,
};
