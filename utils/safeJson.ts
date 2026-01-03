/**
 * Safe JSON Parsing Utilities
 * Prevents application crashes from corrupted or malicious localStorage data
 */

/**
 * Safely parse JSON with fallback value
 * @param json - JSON string to parse
 * @param fallback - Default value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json || typeof json !== 'string') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(json);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('[SafeJSON] Parse failed, using fallback:', error);
    return fallback;
  }
}

/**
 * Safely stringify JSON with error handling
 * @param data - Data to stringify
 * @param fallback - Fallback string if stringify fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify<T>(data: T, fallback: string = '{}'): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('[SafeJSON] Stringify failed, using fallback:', error);
    return fallback;
  }
}

/**
 * Validate JSON structure matches expected type
 * @param data - Parsed data to validate
 * @param validator - Validation function
 * @returns true if valid
 */
export function validateJsonStructure<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): data is T {
  return validator(data);
}

/**
 * Type guard for Todo array
 */
export function isTodoArray(data: unknown): data is Array<{ id: string; text: string; completed: boolean }> {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean'
    )
  );
}

/**
 * Type guard for Template array
 */
export function isTemplateArray(data: unknown): data is Array<{ id: string; name: string; items: string[] }> {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Array.isArray(item.items)
    )
  );
}
