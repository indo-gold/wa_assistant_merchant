/**
 * ============================================================================
 * STRING UTILITIES
 * ============================================================================
 * 
 * Helper functions untuk manipulasi string.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Format number ke Rupiah currency format
 */
export function formatRupiah(num: number): string {
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Generate unique ID dengan prefix
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Truncate string dengan ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize string untuk SQL (basic)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, (char) => {
      switch (char) {
        case '\0':
          return '\\0';
        case '\x08':
          return '\\b';
        case '\x09':
          return '\\t';
        case '\x1a':
          return '\\z';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    })
    .trim();
}

/**
 * Calculate string similarity menggunakan Levenshtein distance
 */
export function stringSimilarity(str1: string, str2: string): number {
  const len1 = str1.toLowerCase().length;
  const len2 = str2.toLowerCase().length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

/**
 * Check if string is similar (threshold 0.9 = 90%)
 */
export function isSimilar(str1: string, str2: string, threshold = 0.9): boolean {
  return stringSimilarity(str1, str2) > threshold;
}

/**
 * Extract URLs from string
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Clean string dari karakter khusus
 */
export function cleanString(str: string): string {
  return str
    .replace(/[^\w\s-]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
