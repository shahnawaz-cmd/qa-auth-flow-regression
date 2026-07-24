export function generateValidEmail(): string {
  const timestamp = Date.now();
  return `testuser_${timestamp}@example.com`;
}
