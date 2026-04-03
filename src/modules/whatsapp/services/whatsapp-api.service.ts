/**
 * ============================================================================
 * WHATSAPP API SERVICE
 * ============================================================================
 *
 * Service untuk komunikasi dengan Meta WhatsApp Cloud API.
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

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'document'
  | 'interactive'
  | 'typing'
  | 'reply_context';

export interface SendMessagePayload {
  type: WhatsAppMessageType;
  to: string;
  data: {
    text?: string;
    url?: string;
    caption?: string;
    reply_message_id?: string;
    message_id?: string;
    interactive?: WhatsAppInteractive;
  };
}

export interface WhatsAppInteractive {
  model: 'reply buttons' | 'url button';
  buttons?: WhatsAppButton[];
  action?: {
    name: string;
    parameters: {
      display_text: string;
      url: string;
    };
  };
}

export interface WhatsAppButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
  payload?: unknown;
}

export interface DownloadedMedia {
  buffer: Buffer;
  fileName: string | null;
}

@Injectable()
export class WhatsappApiService {
  private readonly logger = new Logger(WhatsappApiService.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>('whatsapp.apiUrl')!;
    this.accessToken = this.configService.get<string>('whatsapp.accessToken')!;
    this.phoneNumberId = this.configService.get<string>('whatsapp.phoneNumberId')!;
  }

  async sendMessage(payload: SendMessagePayload): Promise<WhatsAppApiResponse> {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    try {
      const requestBody = this.buildRequestBody(payload);

      const response = await firstValueFrom(
        this.httpService.post<WhatsAppApiResponse>(url, requestBody, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`Message sent to ${payload.to}`);

      return {
        ...response.data,
        payload: requestBody,
      };
    } catch (error) {
      this.handleError('Failed to send message', error as AxiosError);
      throw error;
    }
  }

  async downloadMedia(mediaId: string): Promise<DownloadedMedia> {
    try {
      const metaRes = await firstValueFrom(
        this.httpService.get<{ url: string }>(`${this.apiUrl}/${mediaId}`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }),
      );

      const mediaUrl = metaRes.data.url;

      const mediaRes = await firstValueFrom(
        this.httpService.get<ArrayBuffer>(mediaUrl, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          responseType: 'arraybuffer',
        }),
      );

      const contentDisposition = mediaRes.headers['content-disposition'] as string | undefined;
      let fileName: string | null = null;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) fileName = match[1];
      }

      return { buffer: Buffer.from(mediaRes.data), fileName };
    } catch (error) {
      this.handleError('Failed to download media', error as AxiosError);
      throw error;
    }
  }

  private buildRequestBody(payload: SendMessagePayload): Record<string, unknown> {
    const { type, to, data } = payload;
    const base = { messaging_product: 'whatsapp' };

    switch (type) {
      case 'typing':
        return {
          ...base,
          to,
          status: 'read',
          message_id: data.message_id,
          typing_indicator: { type: 'text' },
        };
      case 'text':
        return {
          ...base,
          to,
          recipient_type: 'individual',
          type: 'text',
          text: { body: data.text },
        };
      case 'reply_context':
        return {
          ...base,
          to,
          recipient_type: 'individual',
          context: { message_id: data.reply_message_id },
          type: 'text',
          text: { body: data.text },
        };
      case 'image':
        return {
          ...base,
          to,
          recipient_type: 'individual',
          type: 'image',
          image: { link: data.url, caption: data.caption || data.text },
        };
      case 'interactive':
        if (data.interactive?.model === 'reply buttons') {
          return {
            ...base,
            to,
            recipient_type: 'individual',
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: data.text },
              action: { buttons: data.interactive.buttons },
            },
          };
        }
        if (data.interactive?.model === 'url button') {
          return {
            ...base,
            to,
            recipient_type: 'individual',
            type: 'interactive',
            interactive: {
              type: 'cta_url',
              body: { text: data.text },
              action: data.interactive.action,
            },
          };
        }
        throw new Error('Invalid interactive model');
      default:
        throw new Error(`Unsupported message type: ${type}`);
    }
  }

  private handleError(message: string, error: AxiosError): void {
    const errorData = error.response?.data;
    this.logger.error(
      `${message}: ${error.response?.status} - ${JSON.stringify(errorData || error.message)}`,
    );
  }
}
