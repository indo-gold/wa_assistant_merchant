/**
 * ============================================================================
 * WEBHOOK DTO
 * ============================================================================
 *
 * DTO untuk webhook payload.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

/**
 * Click link event
 */
export interface ClickLinkData {
  invoice_id: string;
  activity: string; // 'open link', 'login', 'order confirmed'
  timestamp: string;
  user_id?: number;
}

/**
 * Status transaksi event
 */
export interface StatusTransaksiData {
  invoice_id: string;
  status: string; // 'approved', 'cancel', 'pending'
  timestamp: string;
  description?: string;
}

/**
 * Push notification event (KTP verification)
 */
export interface PushNotificationData {
  invoice_id: string;
  status: 'success' | 'failed';
  description?: string;
}

/**
 * Survey event
 */
export interface SurveyData {
  phone_number: string;
  survey: string;
  activity: string;
}
