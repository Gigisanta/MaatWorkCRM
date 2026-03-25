/**
 * ID Validation Helpers
 * Validates CUID and UUID formats for route parameter validation
 */

// CUID pattern: starts with "cuid" followed by alphanumeric characters (typically 25 chars)
const CUID_REGEX = /^cuid[a-z0-9]{20,25}$/i;

// UUID pattern: 8-4-4-4-12 format with hex characters
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if an ID is a valid CUID or UUID format
 * @param id - The ID string to validate
 * @returns true if valid CUID or UUID, false otherwise
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
}

/**
 * Validates an ID and throws a descriptive error if invalid
 * @param id - The ID string to validate
 * @throws Error with descriptive message if ID is invalid
 */
export function validateId(id: string): void {
  if (!isValidId(id)) {
    throw new Error(`ID inválido: "${id}". Debe ser un CUID o UUID válido.`);
  }
}
