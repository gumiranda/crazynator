# Design Document

## Overview

Este documento descreve o design da suíte de testes para os fluxos de pagamento da aplicação CrazyNator. O sistema de testes será construído usando Jest/Vitest como framework principal, com mocks para APIs externas (Stripe.sh) e testes de integração usando banco de dados em memória. A arquitetura de testes seguirá o padrão AAA (Arrange, Act, Assert) e incluirá testes unitários, de integração e end-to-end simulados.

## Architecture

### Test Structure Overview

```
tests/
├── unit/
│   ├── billing/
│   │   ├── procedures.test.ts
│   │   └── subscription.test.ts
│   └── webhooks/
│       └── stripe.test.ts
├── integration/
│   ├── checkout-flow.test.ts
│   ├── webhook-processing.test.ts
│   └── subscription-management.test.ts
├── e2e/
│   └── payment-flows.test.ts
├── fixtures/
│   ├── stripe-webhooks.ts
│   ├── subscription-data.ts
│   └── user-data.ts
├── mocks/
│   ├── stripe-api.ts
│   ├── inngest.ts
│   └── clerk-auth.ts
└── utils/
    ├── test-db.ts
    ├── webhook-helpers.ts
    └── auth-helpers.ts
```

### Test Database Strategy

- **In-Memory SQLite**: Para testes rápidos e isolados
- **Docker PostgreSQL**: Para testes de integração que requerem funcionalidades específicas do PostgreSQL
- **Database Seeding**: Dados de teste consistentes usando factories
- **Transaction Rollback**: Cada teste roda em transação isolada

### Mock Strategy

- **Stripe API**: Mock completo da SDK do Stripe.sh
- **Inngest**: Mock do sistema de jobs para testes síncronos
- **Clerk Auth**: Mock de autenticação para diferentes cenários de usuário
- **Webhooks**: Simulação de payloads reais do Stripe

## Components and Interfaces

### Test Utilities

#### Database Test Helper

```typescript
interface TestDatabase {
  setup(): Promise<void>;
  teardown(): Promise<void>;
  seed(data: SeedData): Promise<void>;
  reset(): Promise<void>;
}
```

#### Webhook Test Helper

```typescript
interface WebhookTestHelper {
  createWebhookPayload(
    type: StripeWebhookEventType,
    data: Partial<StripeEventData>,
  ): StripeWebhookEvent;
  signWebhook(payload: string): string;
  sendWebhook(payload: StripeWebhookEvent): Promise<Response>;
}
```

#### Auth Test Helper

```typescript
interface AuthTestHelper {
  mockUser(userId: string, email: string): void;
  mockUnauthenticated(): void;
  clearAuthMocks(): void;
}
```

### Test Fixtures

#### Subscription Data Factory

```typescript
interface SubscriptionFixture {
  createFreeUser(): UserData;
  createProUser(): UserData;
  createExpiredProUser(): UserData;
  createCanceledProUser(): UserData;
}
```

#### Webhook Payload Factory

```typescript
interface WebhookFixture {
  subscriptionCreated(overrides?: Partial<StripeEventData>): StripeWebhookEvent;
  subscriptionActive(overrides?: Partial<StripeEventData>): StripeWebhookEvent;
  subscriptionCanceled(overrides?: Partial<StripeEventData>): StripeWebhookEvent;
  checkoutCreated(overrides?: Partial<StripeEventData>): StripeWebhookEvent;
}
```

## Data Models

### Test Data Structures

#### User Test Data

```typescript
interface UserTestData {
  id: string;
  email: string;
  name?: string;
  subscription?: SubscriptionTestData;
  customer?: CustomerTestData;
}
```

#### Subscription Test Data

```typescript
interface SubscriptionTestData {
  id: string;
  stripeId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  amount: number;
  currency: string;
  creditsPerPeriod: number;
}
```

#### Webhook Test Data

```typescript
interface WebhookTestData {
  eventId: string;
  eventType: StripeWebhookEventType;
  data: StripeEventData;
  signature?: string;
  processed?: boolean;
}
```

## Error Handling

### Test Error Scenarios

#### API Error Simulation

- **Network Timeouts**: Simular timeouts de API
- **Rate Limiting**: Simular limites de taxa do Stripe
- **Invalid Responses**: Respostas malformadas ou inválidas
- **Authentication Failures**: Falhas de autenticação com Stripe

#### Database Error Simulation

- **Connection Failures**: Falhas de conexão com banco
- **Constraint Violations**: Violações de integridade referencial
- **Transaction Rollbacks**: Falhas durante transações
- **Deadlocks**: Simulação de deadlocks em operações concorrentes

#### Webhook Error Scenarios

- **Invalid Signatures**: Webhooks com assinaturas inválidas
- **Malformed Payloads**: Payloads JSON inválidos
- **Duplicate Events**: Processamento de eventos duplicados
- **Processing Failures**: Falhas durante processamento de eventos

## Testing Strategy

### Unit Tests

#### Billing Procedures Tests

- **getSubscription**: Testa recuperação de dados de assinatura
- **hasProAccess**: Valida verificação de acesso Pro
- **createCheckoutSession**: Testa criação de sessões de checkout
- **cancelSubscription**: Valida cancelamento de assinaturas
- **getBillingHistory**: Testa recuperação de histórico

#### Subscription Library Tests

- **validateStripeWebhook**: Testa validação de webhooks
- **getUserSubscription**: Testa recuperação de assinatura do usuário
- **createOrUpdateSubscription**: Testa criação/atualização de assinaturas
- **getUserCreditsInfo**: Valida cálculo de créditos

#### Webhook Handler Tests

- **POST /api/webhooks/stripe**: Testa recebimento de webhooks
- **Signature Validation**: Valida assinaturas de webhook
- **Event Processing**: Testa processamento de diferentes tipos de evento
- **Error Handling**: Valida tratamento de erros

### Integration Tests

#### Checkout Flow Tests

- **Complete Checkout Flow**: Usuário → Checkout → Webhook → Ativação
- **Failed Payment Flow**: Checkout → Falha → Rollback
- **Upgrade Flow**: FREE → PRO upgrade completo
- **Downgrade Flow**: PRO → FREE downgrade

#### Webhook Processing Tests

- **Subscription Lifecycle**: Created → Active → Canceled
- **Idempotency**: Processamento único de eventos duplicados
- **Error Recovery**: Retry de webhooks falhados
- **Concurrent Processing**: Múltiplos webhooks simultâneos

#### Subscription Management Tests

- **Plan Changes**: Mudanças entre planos
- **Credit Allocation**: Atualização de créditos por plano
- **Access Control**: Verificação de acesso baseado em plano
- **Billing History**: Histórico completo de transações

### End-to-End Tests

#### Complete User Journeys

- **New User Upgrade**: Registro → Upgrade → Uso de recursos Pro
- **Subscription Renewal**: Renovação automática mensal
- **Cancellation Journey**: Cancelamento → Fim do período → Downgrade
- **Failed Payment Recovery**: Falha → Retry → Recuperação

#### Multi-User Scenarios

- **Concurrent Upgrades**: Múltiplos usuários fazendo upgrade
- **Mixed Plan Usage**: Usuários FREE e PRO usando sistema simultaneamente
- **Bulk Operations**: Processamento em lote de webhooks

## Performance Considerations

### Test Execution Speed

- **Parallel Execution**: Testes independentes rodando em paralelo
- **Database Pooling**: Pool de conexões para testes de integração
- **Mock Optimization**: Mocks rápidos para APIs externas
- **Selective Testing**: Execução de subconjuntos de testes

### Resource Management

- **Memory Usage**: Limpeza adequada entre testes
- **Database Connections**: Gerenciamento de conexões de teste
- **Mock Cleanup**: Reset de mocks entre testes
- **Timeout Management**: Timeouts apropriados para diferentes tipos de teste

## Security Testing

### Authentication Tests

- **Unauthorized Access**: Tentativas de acesso sem autenticação
- **Token Validation**: Validação de tokens de autenticação
- **Role-Based Access**: Verificação de permissões por plano

### Webhook Security Tests

- **Signature Validation**: Validação rigorosa de assinaturas
- **Replay Attacks**: Proteção contra ataques de replay
- **Malicious Payloads**: Handling de payloads maliciosos
- **Rate Limiting**: Proteção contra spam de webhooks

## Monitoring and Observability

### Test Metrics

- **Coverage Reports**: Cobertura de código detalhada
- **Performance Metrics**: Tempo de execução de testes
- **Flaky Test Detection**: Identificação de testes instáveis
- **Failure Analysis**: Análise detalhada de falhas

### Test Reporting

- **HTML Reports**: Relatórios visuais de execução
- **CI/CD Integration**: Integração com pipelines de CI/CD
- **Notification System**: Alertas para falhas críticas
- **Historical Tracking**: Acompanhamento de métricas ao longo do tempo
