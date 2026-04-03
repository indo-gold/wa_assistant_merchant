# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of WhatsApp Assistant API
- NestJS 10 + Fastify 4.x architecture
- Multi-provider AI support (OpenAI, Groq, Deepseek, dll)
- 11+ AI tools untuk operasi bisnis
- WhatsApp Cloud API integration
- Cron jobs untuk follow-up dan reminder
- Cost tracking untuk AI usage
- Spam detection dan protection
- JWT authentication
- Swagger API documentation
- Unit dan E2E tests
- Docker support

### Features
- **Webhook Processing**: Terima dan proses pesan WhatsApp
- **AI Orchestrator**: Routing ke agent yang tepat berdasarkan intent
- **Tool Registry**: Sistem plugin untuk ekstensibility
- **Message Buffering**: Gabungkan pesan cepat untuk efisiensi
- **Cart & Order Management**: Kelola cart dan order user
- **Product Catalog**: Cari dan filter produk emas/perak
- **Media Handling**: Upload dan download file
- **Scheduled Tasks**: Cron jobs untuk follow-up otomatis

### Security
- JWT authentication untuk API access
- Spam detection (>50 messages/5 minutes = block)
- HMAC signature verification untuk webhooks
- Environment-based configuration

## [Unreleased]

### Planned
- Redis caching layer
- Rate limiting per user
- Advanced analytics dashboard
- Multi-language support
- Voice message transcription
- Image recognition untuk produk
