/**
 * ============================================================================
 * XENDIT SERVICE
 * ============================================================================
 *
 * Service untuk integrasi dengan Xendit Payment API menggunakan Payment Link.
 *
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface CreateInvoiceRequest {
  externalId: string;
  amount: number;
  payerEmail?: string;
  description: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  currency?: string;
  invoiceDuration?: number; // in seconds
  items?: InvoiceItem[];
  customer?: CustomerInfo;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  category?: string;
  url?: string;
}

export interface CustomerInfo {
  given_names: string;
  surname?: string;
  email?: string;
  mobile_number?: string;
  address?: AddressInfo;
}

export interface AddressInfo {
  country: string;
  street_line1?: string;
  street_line2?: string;
  city?: string;
  province?: string;
  state?: string;
  postal_code?: string;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED';
  merchant_name: string;
  merchant_profile_picture_url: string | null;
  amount: number;
  payer_email: string;
  description: string;
  expiry_date: string;
  invoice_url: string;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
  payment_destination?: string;
  payment_details?: Record<string, unknown>;
  paid_amount?: number;
}

/**
 * ============================================================================
 * XENDIT FEE RULE INTERFACES
 * ============================================================================
 */
export interface CreateFeeRuleRequest {
  name: string;
  description: string;
  unit: 'percentage' | 'flat' | 'PERCENT' | 'FLAT';
  amount: number;
  routes?: Array<{
    type: 'master_account' | 'sub_account';
    sub_account_id?: string;
    percent_amount?: number;
    flat_amount?: number;
    currency?: string;
  }>;
}

export interface XenditFeeRule {
  id: string;
  name: string;
  description: string;
  unit: 'percentage' | 'flat';
  amount: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly subAccountId: string | null;
  private readonly webhookToken: string | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('xendit.apiKey') || '';
    this.apiUrl = this.configService.get<string>('xendit.apiUrl') || 'https://api.xendit.co';
    this.subAccountId = this.configService.get<string>('xendit.subAccountId') || null;
    this.webhookToken = this.configService.get<string>('xendit.webhookToken') || null;
  }

  /**
   * ==========================================================================
   * CREATE INVOICE (PAYMENT LINK)
   * ==========================================================================
   * Membuat payment link invoice di Xendit
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<XenditInvoice> {
    try {
      const url = `${this.apiUrl}/v2/invoices`;

      const payload: Record<string, unknown> = {
        external_id: request.externalId,
        amount: request.amount,
        description: request.description,
        currency: request.currency || 'IDR',
        invoice_duration: request.invoiceDuration || 86400, // Default 24 jam
        payer_email: request.payerEmail || 'customer@indogold.id',
      };

      // Add items if provided
      if (request.items && request.items.length > 0) {
        payload.items = request.items;
      }

      // Add customer if provided
      if (request.customer) {
        payload.customer = request.customer;
      }

      // Add success/failure redirect URLs if provided
      if (request.successRedirectUrl) {
        payload.success_redirect_url = request.successRedirectUrl;
      }
      if (request.failureRedirectUrl) {
        payload.failure_redirect_url = request.failureRedirectUrl;
      }

      const headers: Record<string, string> = {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      };

      // Add for-user-id header if sub-account is configured
      // This routes the payment to the sub-account instead of master account
      if (this.subAccountId) {
        headers['for-user-id'] = this.subAccountId;
        this.logger.log(`Using sub-account: ${this.subAccountId}`);
      }

      this.logger.log(`Creating Xendit invoice: ${request.externalId}`);

      const response = await firstValueFrom(
        this.httpService.post<XenditInvoice>(url, payload, { headers }),
      );

      this.logger.log(`Invoice created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.handleError('Failed to create invoice', error as AxiosError);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * CREATE INVOICE WITH FEE RULE
   * ==========================================================================
   * Membuat invoice dengan platform fee yang otomatis masuk ke Master Account
   */
  async createInvoiceWithFeeRule(
    request: CreateInvoiceRequest,
    feeRuleId: string,
  ): Promise<XenditInvoice> {
    try {
      const url = `${this.apiUrl}/v2/invoices`;

      const payload: Record<string, unknown> = {
        external_id: request.externalId,
        amount: request.amount,
        description: request.description,
        currency: request.currency || 'IDR',
        invoice_duration: request.invoiceDuration || 86400,
        payer_email: request.payerEmail || 'customer@indogold.id',
      };

      if (request.items && request.items.length > 0) {
        payload.items = request.items;
      }

      if (request.customer) {
        payload.customer = request.customer;
      }

      if (request.successRedirectUrl) {
        payload.success_redirect_url = request.successRedirectUrl;
      }
      if (request.failureRedirectUrl) {
        payload.failure_redirect_url = request.failureRedirectUrl;
      }

      const headers: Record<string, string> = {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'with-fee-rule': feeRuleId, // Header untuk platform fee
      };

      // Add for-user-id header if sub-account is configured
      if (this.subAccountId) {
        headers['for-user-id'] = this.subAccountId;
      }

      this.logger.log(`Creating Xendit invoice with fee rule: ${request.externalId}`);

      const response = await firstValueFrom(
        this.httpService.post<XenditInvoice>(url, payload, { headers }),
      );

      this.logger.log(`Invoice with fee rule created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.handleError('Failed to create invoice with fee rule', error as AxiosError);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * CREATE FEE RULE
   * ==========================================================================
   * Membuat fee rule untuk platform fee
   */
  async createFeeRule(request: CreateFeeRuleRequest): Promise<XenditFeeRule> {
    try {
      const url = `${this.apiUrl}/fee_rules`;

      // Konversi unit ke format Xendit (UPPERCASE)
      const xenditUnit = request.unit.toUpperCase() === 'PERCENTAGE' ? 'PERCENT' : request.unit.toUpperCase();
      
      const payload: Record<string, unknown> = {
        name: request.name,
        description: request.description,
        unit: xenditUnit, // 'PERCENT' atau 'FLAT'
        amount: request.amount,
        // Routes - default kirim fee ke master account
        routes: request.routes || [
          {
            type: 'master_account',
            unit: xenditUnit,
            amount: request.amount,
            currency: 'IDR',
          },
        ],
      };

      const headers: Record<string, string> = {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      };

      this.logger.log(`Creating fee rule: ${request.name} (${request.unit}: ${request.amount})`);

      const response = await firstValueFrom(
        this.httpService.post<XenditFeeRule>(url, payload, { headers }),
      );

      this.logger.log(`Fee rule created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.handleError('Failed to create fee rule', error as AxiosError);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * GET INVOICE BY ID
   * ==========================================================================
   */
  async getInvoice(invoiceId: string): Promise<XenditInvoice> {
    try {
      const url = `${this.apiUrl}/v2/invoices/${invoiceId}`;

      const headers: Record<string, string> = {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      };

      const response = await firstValueFrom(this.httpService.get<XenditInvoice>(url, { headers }));

      return response.data;
    } catch (error) {
      this.handleError('Failed to get invoice', error as AxiosError);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * EXPIRE INVOICE
   * ==========================================================================
   * Expire invoice yang masih pending
   */
  async expireInvoice(invoiceId: string): Promise<XenditInvoice> {
    try {
      const url = `${this.apiUrl}/invoices/${invoiceId}/expire!`;

      const headers: Record<string, string> = {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      };

      const response = await firstValueFrom(
        this.httpService.post<XenditInvoice>(url, {}, { headers }),
      );

      this.logger.log(`Invoice expired: ${invoiceId}`);
      return response.data;
    } catch (error) {
      this.handleError('Failed to expire invoice', error as AxiosError);
      throw error;
    }
  }

  /**
   * ==========================================================================
   * VERIFY WEBHOOK SIGNATURE
   * ==========================================================================
   * Verifikasi bahwa webhook berasal dari Xendit
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookToken) {
      this.logger.warn('Webhook token not configured, skipping verification');
      return true;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookToken)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      this.logger.error(`Webhook verification error: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * ==========================================================================
   * HANDLE ERROR
   * ==========================================================================
   */
  private handleError(message: string, error: AxiosError): void {
    const errorData = error.response?.data;
    this.logger.error(
      `${message}: ${error.response?.status} - ${JSON.stringify(errorData || error.message)}`,
    );
  }
}
