export function validateFileName(fileName: string): {
  valid: boolean;
  error?: string;
} {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'File name cannot be empty' };
  }

  if (fileName.length > 255) {
    return { valid: false, error: 'File name too long (max 255 characters)' };
  }

  return { valid: true };
}
