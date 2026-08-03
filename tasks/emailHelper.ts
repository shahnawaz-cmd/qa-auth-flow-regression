export function generateValidEmail(): string {
  // Generates a short 4-character unique tag (e.g. shahnawaz+x9k2@empirepixel.com)
  const shortTag = Math.random().toString(36).substring(2, 6);
  return `shahnawaz+${shortTag}@empirepixel.com`;
}

