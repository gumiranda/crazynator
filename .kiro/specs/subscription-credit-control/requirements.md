# Requirements Document

## Introduction

Esta feature implementa um sistema de controle de créditos baseado no plano de assinatura do usuário, verificando automaticamente os limites de uso antes de permitir a criação de projetos ou envio de mensagens para o gerador de código. O sistema deve diferenciar entre usuários gratuitos (5 créditos mensais), Basic (20 créditos mensais) e Pro (50 créditos mensais), aplicando limites específicos para cada tipo de plano e fornecendo feedback claro sobre o status de uso. Os planos Basic e Pro são identificados via price_id parametrizados em variáveis de ambiente.

## Requirements

### Requirement 1: Credit Status Display for All Plan Types

**User Story:** Como um usuário de qualquer plano (Free, Basic ou Pro), eu quero ser informado sobre meus limites de créditos restantes, para que eu possa gerenciar meu uso da plataforma de forma consciente.

#### Acceptance Criteria

1. WHEN um usuário acessa o dashboard THEN o sistema SHALL exibir o número de créditos restantes no período atual baseado em seu plano
2. WHEN um usuário tem menos de 20% dos créditos restantes THEN o sistema SHALL exibir um aviso sobre o limite próximo
3. WHEN um usuário esgota seus créditos THEN o sistema SHALL exibir uma mensagem informando sobre a necessidade de upgrade (para Free/Basic) ou aguardar renovação (para Pro)
4. IF um usuário não possui assinatura ativa THEN o sistema SHALL aplicar os limites do plano gratuito (5 créditos por 30 dias)
5. IF um usuário possui price_id correspondente ao plano Basic THEN o sistema SHALL aplicar limite de 20 créditos por 30 dias
6. IF um usuário possui price_id correspondente ao plano Pro THEN o sistema SHALL aplicar limite de 50 créditos por 30 dias

### Requirement 2: Credit Consumption Control for All Plans

**User Story:** Como um usuário de qualquer plano com limite de créditos (Free, Basic ou Pro), eu quero ser impedido de criar projetos ou enviar mensagens quando meus créditos acabarem, para que o sistema mantenha controle sobre o uso dos recursos.

#### Acceptance Criteria

1. WHEN um usuário tenta criar um projeto AND não possui créditos suficientes THEN o sistema SHALL bloquear a ação e exibir mensagem de limite excedido
2. WHEN um usuário tenta enviar uma mensagem AND não possui créditos suficientes THEN o sistema SHALL bloquear o envio e sugerir upgrade apropriado
3. WHEN um usuário realiza uma ação que consome créditos THEN o sistema SHALL decrementar automaticamente o contador de créditos baseado em seu plano
4. IF uma ação falha após consumir créditos THEN o sistema SHALL reverter o consumo de créditos
5. WHEN um usuário Basic esgota seus 20 créditos THEN o sistema SHALL sugerir upgrade para plano Pro
6. WHEN um usuário Pro esgota seus 50 créditos THEN o sistema SHALL informar sobre aguardar renovação mensal

### Requirement 3: Plan-Based Credit Limits

**User Story:** Como um usuário com assinatura paga (Basic ou Pro), eu quero ter acesso aos créditos correspondentes ao meu plano, para que eu possa usar a plataforma dentro dos limites contratados.

#### Acceptance Criteria

1. WHEN um usuário possui assinatura Basic ativa com status "active" THEN o sistema SHALL permitir uso de até 20 créditos mensais
2. WHEN um usuário possui assinatura Pro ativa com status "active" THEN o sistema SHALL permitir uso de até 50 créditos mensais
3. WHEN um usuário possui assinatura com status "past_due" THEN o sistema SHALL aplicar limites do plano gratuito temporariamente
4. WHEN um usuário possui assinatura cancelada mas ainda no período pago THEN o sistema SHALL manter os limites do plano contratado até o fim do período
5. IF um usuário possui price_id não reconhecido THEN o sistema SHALL aplicar limites do plano gratuito como fallback

### Requirement 4: Plan Verification and Price ID Management

**User Story:** Como administrador do sistema, eu quero que as verificações de plano sejam realizadas de forma eficiente e segura usando price_ids parametrizados, para que não haja impacto na performance nem vulnerabilidades de segurança.

#### Acceptance Criteria

1. WHEN uma verificação de plano é solicitada THEN o sistema SHALL consultar o banco de dados uma única vez por sessão e comparar com price_ids das variáveis de ambiente
2. WHEN dados de assinatura são acessados THEN o sistema SHALL validar a autenticação do usuário primeiro
3. WHEN uma verificação falha por erro técnico THEN o sistema SHALL aplicar o plano mais restritivo (gratuito) como fallback
4. IF múltiplas verificações são feitas simultaneamente THEN o sistema SHALL usar cache para evitar consultas desnecessárias
5. WHEN o sistema inicializa THEN o sistema SHALL carregar os price_ids dos planos Basic e Pro das variáveis de ambiente
6. IF price_ids não estão configurados nas variáveis de ambiente THEN o sistema SHALL registrar erro e aplicar apenas plano gratuito

### Requirement 5: User Feedback and Plan Status Display

**User Story:** Como usuário do sistema, eu quero receber feedback claro sobre meu status de assinatura e uso de créditos, para que eu possa tomar decisões informadas sobre upgrades.

#### Acceptance Criteria

1. WHEN um usuário acessa qualquer página da aplicação THEN o sistema SHALL exibir seu status atual de plano (Free/Basic/Pro) na interface
2. WHEN um usuário atinge 80% do limite de créditos THEN o sistema SHALL exibir notificação sugerindo upgrade apropriado (Free→Basic, Basic→Pro)
3. WHEN um usuário tenta uma ação bloqueada THEN o sistema SHALL exibir mensagem explicativa com opção de upgrade específica para seu plano atual
4. IF um usuário possui assinatura cancelada THEN o sistema SHALL informar a data de expiração do acesso
5. WHEN um usuário Free visualiza seu status THEN o sistema SHALL mostrar "5 créditos mensais" e opção de upgrade para Basic
6. WHEN um usuário Basic visualiza seu status THEN o sistema SHALL mostrar "20 créditos mensais" e opção de upgrade para Pro
7. WHEN um usuário Pro visualiza seu status THEN o sistema SHALL mostrar "50 créditos mensais" sem opção de upgrade

### Requirement 6: System Integration and Environment Configuration

**User Story:** Como desenvolvedor, eu quero que o sistema de controle de créditos seja integrado de forma transparente com as funcionalidades existentes e use configurações de ambiente, para que não haja quebras na experiência do usuário.

#### Acceptance Criteria

1. WHEN uma verificação de créditos é necessária THEN o sistema SHALL integrar com os procedimentos tRPC existentes
2. WHEN um usuário faz upgrade de plano THEN o sistema SHALL atualizar automaticamente suas permissões sem necessidade de logout
3. WHEN dados de uso são atualizados THEN o sistema SHALL manter consistência com o sistema de rate limiting existente
4. IF uma integração falha THEN o sistema SHALL registrar logs detalhados para debugging
5. WHEN o sistema verifica planos THEN o sistema SHALL usar variáveis de ambiente STRIPE_PRICE_ID_BASIC e STRIPE_PRICE_ID_PRO para identificar os planos
6. WHEN um price_id de assinatura é comparado THEN o sistema SHALL verificar se corresponde aos price_ids configurados nas variáveis de ambiente
