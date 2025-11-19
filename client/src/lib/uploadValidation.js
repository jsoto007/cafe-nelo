const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CLIENT_SIDE_UPLOAD_ERRORS = {
  size: 'Image is too large. Max size is 10MB.',
  type: 'Unsupported image type. Only JPG, PNG, and WebP are allowed.',
  missing: 'Select an image before uploading.'
};

function _extractExtension(filename) {
  if (!filename) {
    return null;
  }
  const baseName = filename.split('/').pop();
  if (!baseName || !baseName.includes('.')) {
    return null;
  }
  return baseName.split('.').pop().toLowerCase();
}

function _normalizeMimeType(mime) {
  if (!mime) {
    return '';
  }
  return mime.split(';')[0].trim().toLowerCase();
}

export function validateImageBeforeUpload(file) {
  if (!file) {
    return { isValid: false, reason: 'missing' };
  }
  const extension = _extractExtension(file.name);
  if (!extension || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return { isValid: false, reason: 'type' };
  }
  const mime = _normalizeMimeType(file.type);
  if (mime && !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return { isValid: false, reason: 'type' };
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    return { isValid: false, reason: 'size' };
  }
  return { isValid: true };
}

export function getClientSideUploadError(reason) {
  if (!reason) {
    return null;
  }
  return CLIENT_SIDE_UPLOAD_ERRORS[reason] ?? CLIENT_SIDE_UPLOAD_ERRORS.type;
}

export function getUploadErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (error.status === 413) {
    return CLIENT_SIDE_UPLOAD_ERRORS.size;
  }
  if (error.status === 415) {
    return CLIENT_SIDE_UPLOAD_ERRORS.type;
  }
  if (error.status === 429) {
    return 'Too many uploads. Please wait a moment and try again.';
  }
  if (error.body?.error) {
    return error.body.error;
  }
  if (Array.isArray(error.body?.errors) && error.body.errors.length) {
    return error.body.errors[0]?.message || null;
  }
  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return null;
}

export { MAX_IMAGE_UPLOAD_SIZE };
