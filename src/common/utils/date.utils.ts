/**
 * ============================================================================
 * DATE UTILITIES
 * ============================================================================
 * 
 * Helper functions untuk manipulasi date/time.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Format date ke MySQL datetime format (YYYY-MM-DD HH:mm:ss)
 */
export function formatToMySQLDatetime(date: Date = new Date()): string {
  // Convert to UTC+7 (WIB) timezone
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wibDate.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Get current timestamp dalam detik (Unix timestamp)
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Cek apakah timestamp masih dalam rentang waktu tertentu (dalam detik)
 */
export function isWithinTimeRange(
  timestamp: number,
  rangeInSeconds: number,
): boolean {
  const currentTime = getCurrentTimestamp();
  return currentTime - timestamp <= rangeInSeconds;
}

/**
 * Format date ke Indonesia locale string
 */
export function formatToIndonesianDate(date: Date = new Date()): string {
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Tambah jam ke date
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Tambah menit ke date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Get start of day (00:00:00)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day (23:59:59)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}
