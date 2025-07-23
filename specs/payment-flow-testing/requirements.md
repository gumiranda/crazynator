# Requirements Document

## Introduction

Esta especificação define os requisitos para implementar testes automatizados abrangentes dos fluxos de pagamento da aplicação CrazyNator. O sistema atual utiliza Polar.sh como provedor de pagamentos, com webhooks para processamento de eventos de assinatura, e possui dois planos: FREE (5 créditos) e PRO (100 créditos por R$ 39,90/mês). Os testes devem cobrir todos os cenários críticos de pagamento, desde a criação de checkout até o processamento de webhooks e gerenciamento de assinaturas.

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero testes automatizados para o fluxo de checkout, para que eu possa garantir que os usuários conseguem iniciar o processo de pagamento corretamente

#### Acceptance Criteria

1. WHEN um usuário autenticado solicita criar uma sessão de checkout THEN o sistema SHALL retornar uma URL válida de checkout
2. WHEN um usuário não autenticado tenta criar checkout THEN o sistema SHALL retornar erro de autorização
3. WHEN parâmetros inválidos são fornecidos para checkout THEN o sistema SHALL retornar erro de validação
4. WHEN o checkout é criado com sucesso THEN o sistema SHALL registrar o customer no banco de dados
5. WHEN o checkout inclui URLs de sucesso e cancelamento THEN o sistema SHALL validar que são URLs válidas

### Requirement 2

**User Story:** Como desenvolvedor, eu quero testes para o processamento de webhooks do Polar, para que eu possa garantir que eventos de pagamento são processados corretamente

#### Acceptance Criteria

1. WHEN um webhook de subscription.created é recebido THEN o sistema SHALL criar uma nova assinatura no banco
2. WHEN um webhook de subscription.active é recebido THEN o sistema SHALL ativar a assinatura e atualizar créditos
3. WHEN um webhook de subscription.canceled é recebido THEN o sistema SHALL cancelar a assinatura
4. WHEN um webhook com assinatura inválida é recebido THEN o sistema SHALL retornar erro 401
5. WHEN um webhook duplicado é recebido THEN o sistema SHALL processar apenas uma vez (idempotência)
6. WHEN um webhook falha no processamento THEN o sistema SHALL registrar o erro e marcar como não processado
7. WHEN webhooks de checkout.created/updated são recebidos THEN o sistema SHALL registrar os eventos

### Requirement 3

**User Story:** Como desenvolvedor, eu quero testes para as operações de gerenciamento de assinatura, para que eu possa garantir que usuários conseguem gerenciar suas assinaturas corretamente

#### Acceptance Criteria

1. WHEN um usuário consulta sua assinatura THEN o sistema SHALL retornar status, plano e informações de créditos corretos
2. WHEN um usuário sem assinatura consulta status THEN o sistema SHALL retornar plano FREE com 5 créditos
3. WHEN um usuário Pro consulta status THEN o sistema SHALL retornar plano PRO com 100 créditos
4. WHEN um usuário solicita cancelamento de assinatura THEN o sistema SHALL processar o cancelamento via Polar
5. WHEN um usuário sem assinatura tenta cancelar THEN o sistema SHALL retornar erro NOT_FOUND
6. WHEN um usuário consulta histórico de cobrança THEN o sistema SHALL retornar lista de assinaturas passadas

### Requirement 4

**User Story:** Como desenvolvedor, eu quero testes para validação de acesso Pro, para que eu possa garantir que recursos premium são protegidos adequadamente

#### Acceptance Criteria

1. WHEN um usuário FREE tenta acessar recursos Pro THEN o sistema SHALL negar acesso
2. WHEN um usuário Pro ativo acessa recursos Pro THEN o sistema SHALL permitir acesso
3. WHEN uma assinatura Pro expira THEN o sistema SHALL revogar acesso Pro automaticamente
4. WHEN uma assinatura Pro é cancelada mas ainda no período THEN o sistema SHALL manter acesso até o fim do período
5. WHEN um usuário Pro tem assinatura pausada THEN o sistema SHALL tratar como FREE temporariamente

### Requirement 5

**User Story:** Como desenvolvedor, eu quero testes para o fluxo de sucesso pós-pagamento, para que eu possa garantir que usuários recebem confirmação adequada após pagamento

#### Acceptance Criteria

1. WHEN um usuário acessa a página de sucesso após pagamento THEN o sistema SHALL verificar status da assinatura
2. WHEN a assinatura está ativa THEN o sistema SHALL exibir confirmação de upgrade para Pro
3. WHEN a assinatura ainda está processando THEN o sistema SHALL exibir status de processamento
4. WHEN há erro na verificação THEN o sistema SHALL permitir nova tentativa de verificação
5. WHEN parâmetros de checkout estão presentes THEN o sistema SHALL exibi-los em modo desenvolvimento

### Requirement 6

**User Story:** Como desenvolvedor, eu quero testes para cenários de erro e recuperação, para que eu possa garantir que falhas são tratadas graciosamente

#### Acceptance Criteria

1. WHEN o Polar está indisponível durante checkout THEN o sistema SHALL retornar erro apropriado
2. WHEN um webhook é recebido mas o banco está indisponível THEN o sistema SHALL tentar novamente via Inngest
3. WHEN dados de webhook estão corrompidos THEN o sistema SHALL registrar erro e não processar
4. WHEN uma assinatura não existe no banco mas webhook é recebido THEN o sistema SHALL criar registro
5. WHEN há conflito de dados entre Polar e banco THEN o sistema SHALL priorizar dados do Polar
6. WHEN processamento de webhook excede timeout THEN o sistema SHALL marcar como falha e permitir retry

### Requirement 7

**User Story:** Como desenvolvedor, eu quero testes de integração end-to-end simulados, para que eu possa validar fluxos completos sem depender de APIs externas

#### Acceptance Criteria

1. WHEN executo teste de fluxo completo de upgrade THEN o sistema SHALL simular checkout → webhook → ativação
2. WHEN executo teste de cancelamento THEN o sistema SHALL simular cancelamento → webhook → desativação
3. WHEN executo teste de falha de pagamento THEN o sistema SHALL simular webhook de falha → rollback
4. WHEN executo teste de renovação THEN o sistema SHALL simular webhook de renovação → atualização de período
5. WHEN executo teste com múltiplos usuários THEN o sistema SHALL processar assinaturas independentemente
