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
