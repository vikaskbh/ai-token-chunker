/**
 * Image handling utilities
 */

import { ImageLimitError } from './errors.js';

/**
 * Normalize image input to a consistent format
 * @param {Buffer|string|Object} image - Image as Buffer, base64 string, or {buffer, mime}
 * @returns {Object} Normalized image object {buffer: Buffer, mime: string, size: number}
 */
export function normalizeImage(image) {
  let buffer;
  let mime = 'image/png'; // default

  if (Buffer.isBuffer(image)) {
    buffer = image;
  } else if (typeof image === 'string') {
    // Assume base64
    buffer = Buffer.from(image, 'base64');
  } else if (image && image.buffer) {
    buffer = Buffer.isBuffer(image.buffer)
      ? image.buffer
      : Buffer.from(image.buffer);
    mime = image.mime || mime;
  } else {
    throw new Error('Invalid image format. Expected Buffer, base64 string, or {buffer, mime}');
  }

  return {
    buffer,
    mime,
    size: buffer.length,
  };
}

/**
 * Validate images against provider limits
 * @param {Array} images - Array of images
 * @param {Object} limits - Provider limits
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {Array} Normalized images
 */
export function validateImages(images, limits, provider, model) {
  if (!images || images.length === 0) {
    return [];
  }

  // Check max image count
  if (images.length > limits.maxImages) {
    throw new ImageLimitError({
      provider,
      model,
      reason: 'maxImages exceeded',
      actual: images.length,
      allowed: limits.maxImages,
    });
  }

  // Normalize and validate each image
  const normalized = images.map((img, index) => {
    const normalizedImg = normalizeImage(img);

    // Check per-image byte limit
    if (normalizedImg.size > limits.imageByteLimit) {
      throw new ImageLimitError({
        provider,
        model,
        reason: 'imageByteLimit exceeded',
        actual: normalizedImg.size,
        allowed: limits.imageByteLimit,
        imageIndex: index,
      });
    }

    return normalizedImg;
  });

  return normalized;
}

/**
 * Calculate total byte size of images
 * @param {Array} images - Array of normalized images
 * @returns {number} Total bytes
 */
export function getImagesByteSize(images) {
  if (!images || images.length === 0) {
    return 0;
  }
  return images.reduce((total, img) => total + (img.size || 0), 0);
}

