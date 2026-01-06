/**
 * Image handling utilities (CommonJS)
 */

const { ImageLimitError } = require('./errors.cjs');

function normalizeImage(image) {
  let buffer;
  let mime = 'image/png';

  if (Buffer.isBuffer(image)) {
    buffer = image;
  } else if (typeof image === 'string') {
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

function validateImages(images, limits, provider, model) {
  if (!images || images.length === 0) {
    return [];
  }

  if (images.length > limits.maxImages) {
    throw new ImageLimitError({
      provider,
      model,
      reason: 'maxImages exceeded',
      actual: images.length,
      allowed: limits.maxImages,
    });
  }

  const normalized = images.map((img, index) => {
    const normalizedImg = normalizeImage(img);

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

function getImagesByteSize(images) {
  if (!images || images.length === 0) {
    return 0;
  }
  return images.reduce((total, img) => total + (img.size || 0), 0);
}

module.exports = {
  normalizeImage,
  validateImages,
  getImagesByteSize,
};

