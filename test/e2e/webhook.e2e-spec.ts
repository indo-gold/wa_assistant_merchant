/**
 * ============================================================================
 * WEBHOOK E2E TESTS
 * ============================================================================
 * 
 * End-to-end tests untuk webhook flow.
 * 
 * @author IndoGold Team
 * @version 1.0.0
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('WebhookController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /webhook', () => {
    it('should verify webhook subscription', () => {
      const verifyToken = process.env.META_VERIFY_TOKEN || 'test-token';
      
      return request(app.getHttpServer())
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'challenge-code',
        })
        .expect(200)
        .expect('challenge-code');
    });

    it('should reject invalid verify token', () => {
      return request(app.getHttpServer())
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'invalid-token',
          'hub.challenge': 'challenge-code',
        })
        .expect(403);
    });
  });

  describe('POST /webhook', () => {
    it('should process text message webhook', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'test-business-id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: '123456',
                  },
                  contacts: [
                    {
                      profile: { name: 'Test User' },
                      wa_id: '6281234567890',
                    },
                  ],
                  messages: [
                    {
                      id: 'wamid.test123',
                      from: '6281234567890',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'text',
                      text: { body: 'Hello' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/webhook')
        .send(payload)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('should ignore old messages', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'test-business-id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: '123456',
                  },
                  contacts: [
                    {
                      profile: { name: 'Test User' },
                      wa_id: '6281234567890',
                    },
                  ],
                  messages: [
                    {
                      id: 'wamid.old123',
                      from: '6281234567890',
                      timestamp: (Math.floor(Date.now() / 1000) - 100).toString(), // 100 seconds ago
                      type: 'text',
                      text: { body: 'Old message' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/webhook')
        .send(payload)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('should process status update webhook', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'test-business-id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: '123456',
                  },
                  statuses: [
                    {
                      id: 'wamid.test123',
                      recipient_id: '6281234567890',
                      status: 'delivered',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/webhook')
        .send(payload)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });
});
