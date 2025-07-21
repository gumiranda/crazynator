# Requirements Document - Análise de Lacunas na Integração de Pagamento

## Introduction

Este documento identifica e define os requisitos para completar a integração de pagamento com Stripe que está parcialmente implementada no projeto. Baseado na análise do código existente, foram identificadas várias lacunas críticas que impedem o funcionamento completo do sistema de billing.

## Requirements

### Requirement 1

**User Story:** Como um desenvolvedor, eu quero que as chaves da API Stripe sejam configuradas corretamente, para que o sistema possa se comunicar com os serviços da Stripe.

#### Acceptance Criteria

1. WHEN o sistema inicia THEN as variáveis de ambiente STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY e STRIPE_WEBHOOK_SECRET SHALL estar configuradas com valores reais
2. WHEN uma requisição é feita para a API Stripe THEN o sistema SHALL usar as chaves corretas para autenticação
3. IF as chaves não estão configuradas THEN o sistema SHALL exibir erro claro indicando a configuração necessária

### Requirement 2

**User Story:** Como um administrador, eu quero que existam planos pré-configurados no banco de dados, para que os usuários possam visualizar e selecionar opções de assinatura.

#### Acceptance Criteria

1. WHEN o sistema é inicializado THEN SHALL existir pelo menos um plano ativo no banco de dados
2. WHEN um usuário acessa a página de pricing THEN o sistema SHALL exibir planos disponíveis com preços e recursos
3. WHEN novos produtos são criados na Stripe THEN o sistema SHALL sincronizar automaticamente os planos locais

### Requirement 3

**User Story:** Como um usuário, eu quero que o sistema registre automaticamente meu uso de recursos, para que meus limites sejam controlados adequadamente.

#### Acceptance Criteria

1. WHEN um usuário cria um projeto THEN o sistema SHALL registrar o uso do recurso "projects"
2. WHEN um usuário faz uma chamada de API THEN o sistema SHALL registrar o uso do recurso "apiCalls"
3. WHEN um usuário excede um limite THEN o sistema SHALL bloquear a ação e sugerir upgrade
4. WHEN uma assinatura é renovada THEN o sistema SHALL resetar os contadores de uso

### Requirement 4

**User Story:** Como um usuário, eu quero que o checkout da Stripe funcione corretamente, para que eu possa assinar um plano sem erros.

#### Acceptance Criteria

1. WHEN um usuário seleciona um plano THEN o sistema SHALL criar uma sessão de checkout válida
2. WHEN o checkout é concluído THEN o sistema SHALL receber confirmação via webhook
3. WHEN o pagamento é processado THEN o sistema SHALL criar/atualizar a assinatura do usuário
4. IF o checkout falha THEN o sistema SHALL exibir mensagem de erro apropriada

### Requirement 5

**User Story:** Como um usuário, eu quero que minha assinatura seja sincronizada corretamente com a Stripe, para que meu status de pagamento seja sempre preciso.

#### Acceptance Criteria

1. WHEN um webhook da Stripe é recebido THEN o sistema SHALL processar o evento corretamente
2. WHEN uma assinatura é cancelada na Stripe THEN o sistema SHALL atualizar o status local
3. WHEN um pagamento falha THEN o sistema SHALL atualizar o status para PAST_DUE
4. WHEN uma assinatura é renovada THEN o sistema SHALL resetar limites de uso

### Requirement 6

**User Story:** Como um usuário, eu quero poder gerenciar minha assinatura através do portal da Stripe, para que eu tenha controle total sobre meus pagamentos.

#### Acceptance Criteria

1. WHEN um usuário clica em "Gerenciar Assinatura" THEN o sistema SHALL redirecionar para o portal da Stripe
2. WHEN o usuário retorna do portal THEN o sistema SHALL sincronizar as mudanças
3. WHEN o usuário cancela no portal THEN o sistema SHALL refletir o cancelamento
4. WHEN o usuário atualiza método de pagamento THEN o sistema SHALL manter a assinatura ativa

### Requirement 7

**User Story:** Como um desenvolvedor, eu quero que o sistema tenha tratamento robusto de erros, para que falhas de pagamento não quebrem a aplicação.

#### Acceptance Criteria

1. WHEN uma API da Stripe falha THEN o sistema SHALL registrar o erro e continuar funcionando
2. WHEN um webhook falha no processamento THEN o sistema SHALL tentar novamente
3. WHEN dados inconsistentes são detectados THEN o sistema SHALL alertar e corrigir
4. WHEN limites de rate da Stripe são atingidos THEN o sistema SHALL implementar backoff

### Requirement 8

**User Story:** Como um usuário, eu quero que o sistema funcione mesmo sem assinatura ativa, para que eu possa explorar funcionalidades básicas.

#### Acceptance Criteria

1. WHEN um usuário não tem assinatura THEN o sistema SHALL permitir acesso limitado
2. WHEN um usuário excede limites gratuitos THEN o sistema SHALL sugerir assinatura
3. WHEN uma assinatura expira THEN o sistema SHALL manter dados do usuário
4. WHEN um usuário reativa assinatura THEN o sistema SHALL restaurar acesso completo

### Requirement 9

**User Story:** Como um usuário, eu quero que o controle de uso seja integrado em todas as funcionalidades principais, para que meus limites sejam respeitados consistentemente.

#### Acceptance Criteria

1. WHEN um usuário tenta criar um projeto THEN o sistema SHALL verificar limite de projetos
2. WHEN um usuário faz uma requisição de geração de código THEN o sistema SHALL verificar limite de API calls
3. WHEN um usuário salva arquivos THEN o sistema SHALL verificar limite de storage
4. IF um limite é excedido THEN o sistema SHALL bloquear a ação e mostrar opções de upgrade

### Requirement 10

**User Story:** Como um administrador, eu quero que o sistema tenha scripts de setup e migração, para que a configuração inicial seja automatizada.

#### Acceptance Criteria

1. WHEN o sistema é deployado pela primeira vez THEN SHALL existir script para criar planos iniciais
2. WHEN produtos são atualizados na Stripe THEN SHALL existir comando para sincronizar planos
3. WHEN dados precisam ser migrados THEN SHALL existir scripts de migração seguros
4. WHEN o ambiente é configurado THEN SHALL existir validação de configuração completa
