/**
 * ============================================================================
 * META WEBHOOK DTO
 * ============================================================================
 * 
 * DTO untuk webhook payload dari Meta WhatsApp API.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { IsString, IsArray, ValidateNested } from 'class-validator';

/**
 * WhatsApp message object
 */
export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'interactive' | 'order' | 'reaction';
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; filename: string; mime_type: string };
  sticker?: { id: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  order?: {
    catalog_id: string;
    product_items: Array<{
      product_retailer_id: string;
      quantity: number;
      item_price: number;
      currency: string;
    }>;
  };
  reaction?: { message_id: string; emoji: string };
  context?: {
    id?: string;
    referred_product?: {
      catalog_id: string;
      product_retailer_id: string;
    };
  };
}

/**
 * WhatsApp status update
 */
export interface WhatsAppStatus {
  id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  conversation?: {
    id: string;
    origin: { type: string };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: { details: string };
  }>;
}

/**
 * Webhook entry
 */
export interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: { name: string };
        wa_id: string;
      }>;
      messages?: WhatsAppMessage[];
      statuses?: WhatsAppStatus[];
      errors?: Array<{
        code: number;
        title: string;
        message: string;
        error_data?: { details: string };
      }>;
    };
    field: string;
  }>;
}

/**
 * Meta webhook payload
 */
export class MetaWebhookPayload {
  @IsString()
  object!: string;

  @IsArray()
  @ValidateNested({ each: true })
  entry!: WebhookEntry[];
}

/**
 * Webhook verification query
 */
export class WebhookVerifyQuery {
  @IsString()
  'hub.mode'!: string;

  @IsString()
  'hub.verify_token'!: string;

  @IsString()
  'hub.challenge'!: string;
}

/**
 * Message template status update
 */
export interface TemplateStatusUpdate {
  event: 'APPROVED' | 'REJECTED' | 'PAUSED' | 'PENDING' | 'DISABLED';
  message_template_id: string;
  message_template_name: string;
  message_template_language: string;
  reason?: string;
}
