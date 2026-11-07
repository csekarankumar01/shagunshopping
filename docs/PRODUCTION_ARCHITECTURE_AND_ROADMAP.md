# ShagunShopping — Zero-Oversell High-Scale Architecture (Redis, Kafka, Docker, Kubernetes)

> **Document Type:** Enterprise Architecture Specification & Concurrency Audit  
> **Target Scale:** 20,000+ Concurrent Users / Flash Sales  
> **Status:** Production Architecture v3.0  
> **Generated PDF:** [`docs/SYSTEM_DESIGN_AND_PRODUCTION_ROADMAP.pdf`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/docs/SYSTEM_DESIGN_AND_PRODUCTION_ROADMAP.pdf)

---

## 1. The Concurrency Problem: Racing for the Last Item

In high-traffic e-commerce (such as during festive sales or Instagram drop campaigns), the most severe failure mode occurs when **Product X has exactly 1 unit left in stock**, and **Customer A and Customer B click "Pay" at the exact same millisecond**.

### Why Naive Architectures Fail
1. **The Double-Debit Disaster (Checking stock only after payment):**
   - Both Customer A and Customer B read `stock = 1` from MongoDB.
   - Both are redirected to Razorpay to pay ₹1,499.
   - Customer A pays at 12:00:01.050 ➔ Stock drops to 0.
   - Customer B pays at 12:00:01.075 ➔ Bank deducts ₹1,499 from Customer B!
   - When the server tries to fulfill Customer B ➔ **OUT OF STOCK!**
   - **Result:** Customer B was charged, has no product, and the business must issue manual refunds and handle customer complaints.

2. **The Ghost-Stock Trap (Deducting stock before payment):**
   - Customer A clicks checkout ➔ Server decrements stock immediately in DB (`stock = 0`).
   - Customer B arrives ➔ Sees "Out of Stock" and leaves the site.
   - Customer A abandons the Razorpay modal, phone battery dies, or card is declined.
   - **Result:** Stock remains locked at 0 in the database indefinitely. The merchant loses the sale to Customer B.

---

## 2. The Enterprise Solution: Atomic Two-Phase Leased Reservation (Redis + Kafka)

### The Three Pillars of Zero-Oversell Consistency
1. **Phase 1: Atomic Soft-Lock in Redis via Single-Threaded Lua Script:**
   - When Customer A initiates payment, an atomic Lua script decrements the Redis stock counter and sets an expiring reservation key (`TTL = 10 minutes`).
   - Redis executes Lua scripts **atomically in a single thread**.
   - When Customer B's request arrives 1 millisecond later, Redis executes Customer B's script sequentially. It sees `current_stock = 0 < 1`, and returns `0` (Out of Stock).
   - Customer B is rejected with HTTP 409 **before any payment gateway is ever invoked**. Customer B is NEVER charged.
2. **Phase 2: Asynchronous Event via Apache Kafka on Payment Capture:**
   - When Customer A completes payment on Razorpay, a `PAYMENT_CAPTURED` event is emitted to Kafka topic `shagunshopping.payment.events`.
   - The inventory consumer commits the reservation in Redis and decrements the permanent MongoDB record.
3. **Phase 3: Automatic TTL Compensating Release:**
   - If Customer A abandons the payment or cancels, the Redis reservation key expires after 10 minutes, returning the stock to the available pool automatically.

---

## 3. Sequence Flow Diagram

```
Customer A                  Customer B                   Express API                  Redis (Memory)               Kafka Broker
    │                           │                             │                             │                           │
    │── 1. POST /orders/pay ───┼────────────────────────────▶│                             │                           │
    │                           │── 2. POST /orders/pay ─────▶│                             │                           │
    │                           │                             │                             │                           │
    │                           │                             │── 3. EVAL Lua (Order A) ───▶│                           │
    │                           │                             │                             │ (stock=1 >= 1)            │
    │                           │                             │                             │ stock:product:123 ➔ 0     │
    │                           │                             │                             │ SET reservation:A:123     │
    │                           │                             │◀── Returns 1 (SUCCESS) ─────│ (TTL = 600s)              │
    │                           │                             │                             │                           │
    │                           │                             │── 4. EVAL Lua (Order B) ───▶│                           │
    │                           │                             │                             │ (stock=0 < 1)             │
    │                           │                             │◀── Returns 0 (OUT_OF_STOCK)─│                           │
    │                           │                             │                             │                           │
    │◀─ 5. Open Razorpay (₹1499)│                             │                             │                           │
    │                           │◀─ 6. HTTP 409 Conflict ─────│                             │                           │
    │                           │   "Reserved by shopper"     │                             │                           │
    │                           │   (NO MONEY CHARGED)        │                             │                           │
    │                           │                             │                             │                           │
[Customer A Pays on Razorpay]   │                             │                             │                           │
    │── 7. POST /payment/verify──────────────────────────────▶│                             │                           │
    │                           │                             │── 8. Emit PaymentCaptured ─────────────────────────────▶│
    │                           │                             │                             │                           │ [Topic: payment.events]
    │                           │                             │◀────────────────────────────┼───────────────────────────│
    │                           │                             │                             │                           │
    │                           │                             │── 9. Finalize Commit ──────▶│ [Delete res key]          │
    │                           │                             │── 10. BulkWrite Mongo ─────▶│ [Product.stock = 0]       │
    │◀─ 11. Order Confirmed ────┼─────────────────────────────│                             │                           │
```

---

## 4. Apache Kafka Event-Driven Architecture

### Topic Topology & Event Schema
- `shagunshopping.order.events`: `ORDER_CREATED`, `ORDER_CANCELLED`
- `shagunshopping.payment.events`: `PAYMENT_CAPTURED`, `PAYMENT_FAILED`
- `shagunshopping.inventory.events`: `STOCK_RESERVED`, `STOCK_RELEASED`, `STOCK_EXHAUSTED`
- `shagunshopping.notification.events`: `SEND_OTP`, `SEND_ORDER_CONFIRMATION`, `SEND_SHIPPED_SMS`

All order events use `orderId` as the Kafka partition key, guaranteeing strict in-order chronological execution per order.

---

## 5. Docker Compose & Kubernetes Cluster Specifications

### 5.1 Docker Orchestration (`docker-compose.yml`)
Run the entire cluster locally with:
```bash
docker compose up -d
```
Services booted:
- **frontend:** React SPA served via Nginx (port 3000)
- **backend:** Node 20 Express API (port 5001)
- **mongo:** MongoDB 7.0 (port 27017)
- **redis:** Redis 7.2 Alpine with AOF persistence (port 6379)
- **kafka:** Apache Kafka 3.7.0 in KRaft mode (port 9092)
- **kafka-ui:** Web console for Kafka topics and consumer groups (port 8080)

### 5.2 Kubernetes Production Manifests (`k8s/`)
- `k8s/namespace.yaml`: Production namespace `shagunshopping`
- `k8s/config-and-secrets.yaml`: ConfigMaps and encrypted Secrets
- `k8s/redis.yaml`: Redis deployment with liveness/readiness probes
- `k8s/kafka.yaml`: Apache Kafka KRaft deployment
- `k8s/backend.yaml`: API deployment with rolling update strategy (zero downtime)
- `k8s/frontend-ingress-hpa.yaml`: Storefront deployment, Ingress with Let's Encrypt TLS, and HPA (scaling 2 to 10 pods)

---

## 6. Codebase Implementation Map
- **Redis Connection:** [`backend-shagunshopping/src/config/redis.js`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/backend-shagunshopping/src/config/redis.js)
- **Atomic Inventory Lua Engine:** [`backend-shagunshopping/src/services/inventoryLockService.js`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/backend-shagunshopping/src/services/inventoryLockService.js)
- **Kafka Configuration:** [`backend-shagunshopping/src/config/kafka.js`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/backend-shagunshopping/src/config/kafka.js)
- **Domain Event Producer:** [`backend-shagunshopping/src/events/eventProducer.js`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/backend-shagunshopping/src/events/eventProducer.js)
- **Inventory Consumer Group:** [`backend-shagunshopping/src/events/inventoryConsumer.js`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/backend-shagunshopping/src/events/inventoryConsumer.js)
- **Docker Compose:** [`docker-compose.yml`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/docker-compose.yml)
- **Kubernetes Manifests:** [`k8s/`](file:///Users/apple/Downloads/Importants/ShagunShoppinLive/k8s)
