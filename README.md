# WhatsApp Assistant API

[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://fastify.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> 🤖 AI-powered WhatsApp Assistant untuk layanan pelanggan

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Arsitektur](#-arsitektur)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## ✨ Fitur

### Core Features

- 💬 **WhatsApp Integration** - Terima dan balas pesan via Meta WhatsApp Cloud API
- 🧠 **Multi-Provider AI** - Support OpenAI, Groq, Deepseek, dan lainnya
- 🔧 **Tool System** - 11+ tools untuk operasi bisnis (order, cart, produk, dll)
- 📊 **Cost Tracking** - Pantau penggunaan token AI per user
- 🛡️ **Spam Protection** - Deteksi dan blokir spam otomatis
- 🕐 **Message Buffering** - Gabungkan pesan cepat untuk efisiensi

### Cron Jobs

- 🔔 **Follow-up Cart** - Reminder cart pending setelah 4 jam
- 🛒 **Follow-up Order** - Reminder order belum checkout setelah 2 jam
- 📦 **Product Reminder** - Notifikasi produk tersedia kembali
- 📋 **Survey** - Kirim survey ke user aktif

### Webhook Support

- Meta WhatsApp Webhook (pesan masuk, status update)

## 🏗️ Arsitektur

```
wa_assistant - new/
├── src/
│   ├── common/              # Shared utilities, decorators, filters
│   ├── config/              # Environment & database configuration
│   ├── database/            # Sequelize models
│   ├── modules/
│   │   ├── ai/             # AI Orchestrator & Tool Registry
│   │   ├── auth/           # JWT Authentication
│   │   ├── chat/           # Chat history & buffering
│   │   ├── cron/           # Scheduled tasks
│   │   ├── media/          # File upload/download
│   │   ├── order/          # Cart & Order management
│   │   ├── product/        # Product catalog
│   │   ├── user/           # User management
│   │   ├── webhook/        # Webhook controllers
│   │   └── whatsapp/       # WhatsApp API service
│   └── main.ts             # Application entry point
├── test/
│   ├── unit/               # Unit tests
│   ├── e2e/                # End-to-end tests
│   └── mocks/              # Test mocks
└── package.json
```

## 📦 Prerequisites

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** atau **yarn**
- **Meta WhatsApp Business Account**
- **OpenAI API Key** (atau provider AI lain)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd "wa_assistant - new"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 4. Setup Database

```bash
# Buat database MySQL
mysql -u root -p -e "CREATE DATABASE wa_assistant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations (jika ada)
npm run migration:run
```

### 5. Build & Run

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Aplikasi akan berjalan di `http://localhost:3000`

## ⚙️ Konfigurasi

### Environment Variables

| Variable                   | Deskripsi                            | Required                 |
| -------------------------- | ------------------------------------ | ------------------------ |
| `NODE_ENV`                 | Environment (development/production) | Yes                      |
| `PORT`                     | Port server                          | No (default: 3000)       |
| `DATABASE_HOST`            | MySQL host                           | Yes                      |
| `DATABASE_PORT`            | MySQL port                           | Yes                      |
| `DATABASE_USERNAME`        | MySQL username                       | Yes                      |
| `DATABASE_PASSWORD`        | MySQL password                       | Yes                      |
| `DATABASE_NAME`            | MySQL database name                  | Yes                      |
| `JWT_SECRET`               | Secret key untuk JWT                 | Yes                      |
| `WHATSAPP_ACCESS_TOKEN`    | Meta WhatsApp access token           | Yes                      |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID             | Yes                      |
| `META_VERIFY_TOKEN`        | Token untuk webhook verification     | Yes                      |
| `OPENAI_API_KEY`           | OpenAI API key                       | Yes (atau provider lain) |

### WhatsApp Webhook Setup

1. Buka [Meta Developers Console](https://developers.facebook.com/)
2. Pilih WhatsApp app Anda
3. Konfigurasi webhook URL: `https://your-domain.com/webhook`
4. Verify token: sama dengan `META_VERIFY_TOKEN` di .env
5. Subscribe ke events: `messages`, `message_statuses`

## 📖 Penggunaan

### API Endpoints

#### Authentication

```bash
# Login dengan API Key
POST /auth?api_key=your-api-key
```

#### Webhook

```bash
# Meta Webhook (GET - Verification)
GET /webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx

# Meta Webhook (POST - Receive messages)
POST /webhook
Content-Type: application/json

X-Hub-Signature-256: sha256=xxx
```

#### Users

```bash
# Get all users
GET /users
Authorization: Bearer <token>

# Get user by ID
GET /users/:id
Authorization: Bearer <token>

# Create user
POST /users
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "John Doe",
  "phone_number": "6281234567890",
  "status": "active"
}

# Update user
PATCH /users/:id
Authorization: Bearer <token>
```

#### Chat History

```bash
# Get chat history by user
GET /chat/history/:userId
Authorization: Bearer <token>
```

#### Products

```bash
# Get all products
GET /products

# Get products with filter
GET /products?product_name=Emas&in_stock=true

# Get product by ID
GET /products/:id
```

#### Orders

```bash
# Get user orders
GET /orders/user/:userId
Authorization: Bearer <token>

# Get order by cart ID
GET /orders/cart/:cartId
Authorization: Bearer <token>
```

#### Cart

```bash
# Get user cart
GET /cart/user/:userId
Authorization: Bearer <token>
```

#### Media

```bash
# Upload file
POST /media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

# Download file
GET /media/:filename
```

### Swagger Documentation

Buka `http://localhost:3000/api/docs` untuk melihat dokumentasi API lengkap.

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:cov
```

### E2E Tests

```bash
# Run e2e tests
npm run test:e2e
```

### Test Structure

```
test/
├── mocks/              # Mock classes untuk testing
│   ├── database.mock.ts
│   └── services.mock.ts
├── unit/               # Unit tests
│   └── services/
│       ├── user.service.spec.ts
│       ├── chat.service.spec.ts
│       └── product.service.spec.ts
└── e2e/                # End-to-end tests
    └── webhook.e2e-spec.ts
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t wa-assistant .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name wa-assistant \
  wa-assistant
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name wa-assistant

# Save PM2 config
pm2 save
pm2 startup
```

## 🔧 Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Error

- Periksa konfigurasi database di `.env`
- Pastikan MySQL service berjalan
- Verifikasi user dan password database

#### WhatsApp Webhook Not Receiving

- Periksa verify token di Meta Console
- Pastikan URL webhook bisa diakses dari internet
- Check logs untuk error details

#### AI Response Error

- Verifikasi API key di `.env`
- Check rate limits dari provider AI
- Monitor cost tracking di database

### Logs

```bash
# Development logs
npm run start:dev

# Production logs
pm2 logs wa-assistant

# Docker logs
docker logs wa-assistant
```

### Support

Untuk bantuan lebih lanjut, hubungi:

- Email: support@indogold.id
- WhatsApp: 0812-3456-7890

## 📄 License

[MIT](LICENSE)

## 👥 Contributors

- IndoGold Development Team

---

<p align="center">Made with ❤️ by IndoGold Team</p>

━━━━━━━━━━━━━━━━━━━━━
⚠️ KETENTUAN PENTING:
• ⏰ Harga di atas berlaku selama 5 menit
• 🛒 Cart akan otomatis expired dalam 5 menit
• 💳 Setelah checkout, Anda harus bayar dalam 3 jam
• 📈 Setelah 5 menit, harga dapat berubah mengikuti pasar
• ⚡ Stok terbatas, segera checkout untuk mengamankan harga
━━━━━━━━━━━━━━━━━━━━━
