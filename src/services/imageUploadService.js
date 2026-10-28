import { SessionStorage } from './sessionStorage.js';

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates base64 data URL and checks magic byte signatures
 * to prevent extension spoofing and malicious executable uploads.
 */
export function validateImageContent(dataUrl, declaredMime = '') {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { isValid: false, error: 'No image data provided.' };
  }

  // Check header prefix
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid image format. Must be a valid JPEG, PNG, or WebP base64 image.',
    };
  }

  const mime = (match[1] || declaredMime).toLowerCase().trim();
  const base64Data = match[2];

  // 1. MIME check
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      isValid: false,
      error: `Unsupported image format (${mime}). Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  // 2. Approximate size calculation from base64 string
  // (Base64 length * 3/4 - padding bytes)
  const approxSizeBytes = Math.round((base64Data.length * 3) / 4);
  if (approxSizeBytes > MAX_IMAGE_SIZE_BYTES) {
    const sizeInMb = (approxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `Image exceeds 3MB limit (Current size: ${sizeInMb}MB). Please upload a smaller file.`,
    };
  }

  // 3. Inspect magic bytes signature from base64 head
  const head = base64Data.substring(0, 32);

  // JPEG magic bytes: /9j/
  const isJpeg = mime === 'image/jpeg' && head.startsWith('/9j/');
  // PNG magic bytes: iVBORw0KGgo
  const isPng = mime === 'image/png' && head.startsWith('iVBORw0KGgo');
  // WebP magic bytes: UklGR
  const isWebp = mime === 'image/webp' && head.startsWith('UklGR');

  if (!isJpeg && !isPng && !isWebp) {
    return {
      isValid: false,
      error: 'File signature verification failed. The file contents do not match a valid JPEG, PNG, or WebP image.',
    };
  }

  const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';

  return {
    isValid: true,
    error: null,
    mimeType: mime,
    sizeBytes: approxSizeBytes,
    extension,
  };
}

/**
 * Generates a sanitized storage key scoped strictly to the authenticated user ID
 */
export function getSafeStorageKey(userId) {
  const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `@soloplay_avatar_${sanitizedUserId}`;
}

export const ImageUploadService = {
  MAX_SIZE_BYTES: MAX_IMAGE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,

  /**
   * Validates and saves a user's profile picture safely
   */
  async saveUserProfilePicture(userId, dataUrl, declaredMime) {
    if (!userId) {
      throw new Error('Unauthorized: User ID is required.');
    }

    const validation = validateImageContent(dataUrl, declaredMime);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const storageKey = getSafeStorageKey(userId);
    const safeFilename = `avatar_${Date.now()}.${validation.extension}`;

    const payload = {
      userId,
      filename: safeFilename,
      mimeType: validation.mimeType,
      dataUrl,
      updatedAt: new Date().toISOString(),
    };

    try {
      await SessionStorage.setItem(storageKey, payload);
      return {
        success: true,
        dataUrl,
        filename: safeFilename,
        updatedAt: payload.updatedAt,
      };
    } catch (err) {
      console.error('Failed to save profile picture:', err);
      return {
        success: false,
        error: 'Storage failure: Could not save profile picture.',
      };
    }
  },

  /**
   * Retrieves profile picture for authenticated user
   */
  async getUserProfilePicture(userId) {
    if (!userId) return null;
    const storageKey = getSafeStorageKey(userId);
    try {
      const record = await SessionStorage.getItem(storageKey);
      if (record && record.dataUrl) {
        return record.dataUrl;
      }
      return null;
    } catch (err) {
      console.error('Failed to retrieve profile picture:', err);
      return null;
    }
  },

  /**
   * Removes profile picture for authenticated user
   */
  async removeUserProfilePicture(userId) {
    if (!userId) return;
    const storageKey = getSafeStorageKey(userId);
    try {
      await SessionStorage.removeItem(storageKey);
      return { success: true };
    } catch (err) {
      console.error('Failed to remove profile picture:', err);
      return { success: false };
    }
  },
};

export default ImageUploadService;
