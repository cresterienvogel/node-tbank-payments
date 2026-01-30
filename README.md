# 💳 T-Bank Payments API

<p>
  <img src="https://img.shields.io/badge/NestJS-10-red?&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-red?&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-brightgreen?&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue?&logo=docker&logoColor=white" />
</p>

---

## 📌 Overview

**T-Bank Payments API** is a backend service providing real T-Bank (T-Kassa) payment integration.

The project is focusing on:
- Reliable integration with an external payment provider (T-Bank)
- Safe and idempotent payment initialization
- Controlled payment and order state transitions via a state machine
- Correct handling and deduplication of provider webhooks
- Separation of payment processing from business logic
- Guaranteed delivery of business events using the outbox pattern
- Event-driven communication with external systems via HTTP callbacks

No UI. No sessions.  
Only a clean, explicit HTTP API designed to be integrated with **any backend or language**.

---

## ✨ Features

| Feature | Description |
|------|------------|
| Order management | Create and track payment orders |
| T-Bank integration | Real payment initialization and provider status synchronization |
| REST API security | API key–based authentication |
| OpenAPI (Swagger) | Interactive API documentation for local development and testing |
| Webhooks | Provider callbacks with deduplication |
| Idempotency | Safe retries using `Idempotency-Key` |
| Payment state machine | Controlled and validated status transitions |
| Outbox pattern | Guaranteed event delivery after database commit |
| Event callbacks | Asynchronous HTTP callbacks after successful payment |
| Demo consumer | Example callback receiver for post-payment business logic |
| Docker-ready | One-command local or server deployment |

---

## 🧰 Tech Stack

| Component | Tech |
|---------|------|
| API | NestJS 10 |
| Database | PostgreSQL 16 |
| Cache / Queues | Redis 7 |
| ORM | Prisma |
| Migrations | Prisma Migrate |
| Runtime | Node.js 20 |
| Deployment | Docker & Docker Compose |

---

## 🧠 Architecture Highlights

### Payment flow

```
Client
  ↓
Orders API
  ↓
Payments API (Init)
  ↓
T-Bank
  ↓
Webhook (/v1/webhooks/tbank)
  ↓
Payment state machine
  ↓
Outbox event (ORDER_PAID)
  ↓
HTTP callback (consumer)
```

### Key design decisions

- **Payment provider is isolated** from business logic
- Webhooks are **deduplicated** and **idempotent**
- Status transitions are validated via a **state machine**
- Business events are delivered via **outbox**, not inline logic
- Consumers can be written in **any language**

---

## 🔐 Authentication

All protected endpoints require:

```
X-API-Key: <API_KEY>
```

The API key represents a **service-level integration**, not an end-user session.

---

## 🗺️ Endpoints

### Orders
- `POST /v1/orders` — create order
- `GET /v1/orders/{id}` — get order with payments

### Payments
- `POST /v1/orders/{orderId}/payments` — create payment (Init)
- `GET /v1/payments/{paymentId}` — get payment
- `POST /v1/payments/{paymentId}/sync` — force provider status sync

### Webhooks
- `POST /v1/webhooks/tbank` — T-Bank provider webhook

### Demo
- `POST /v1/demo/callback-receiver` — example consumer of payment events

---

## 🔁 Event callbacks

After successful payment, the service sends an HTTP callback:

```json
{
  "type": "ORDER_PAID",
  "eventId": "uuid",
  "createdAt": "2026-01-30T15:44:01.285Z",
  "data": {
    "orderId": "uuid",
    "paymentId": "uuid",
    "amount": 1000,
    "currency": "RUB",
    "provider": "tbank"
  }
}
```

The callback URL is configurable:

```env
AFTER_PAYMENT_CALLBACK_URL=https://example.com/payment-callback
```

The consumer can be implemented in **any language** (PHP, Node.js, Python, etc.).

---

## 🧪 Quick tests

### Create order
```bash
curl -X POST http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_api_key" \
  -d '{"amount":1000,"description":"Test order"}'
```

### Create payment
```bash
curl -X POST http://localhost:3000/v1/orders/ORDER_ID/payments \
  -H "X-API-Key: dev_api_key" \
  -H "Idempotency-Key: test-1" \
  -d "{}"
```

### Get order
```bash
curl http://localhost:3000/v1/orders/ORDER_ID \
  -H "X-API-Key: dev_api_key"
```

---

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/cresterienvogel/node-tbank-payments.git
cd node-tbank-payments
```

### 2. Create `.env`
```bash
cp .env.example .env
```

### 3. Run with Docker
```bash
docker compose up --build
```

Swagger UI:
```
http://localhost:3000/docs
```
