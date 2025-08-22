# Documento de Requisitos

## Introdução

Este recurso transformará o sistema atual em uma solução whitelabel, permitindo que múltiplas organizações utilizem a plataforma com sua própria identidade visual, domínios personalizados e dados isolados. O sistema whitelabel possibilitará a criação de múltiplas instâncias de inquilinos (tenants) mantendo uma única base de código e infraestrutura, proporcionando a cada inquilino uma experiência completamente personalizada que aparenta ser seu próprio produto.

## Requisitos

### Requisito 1

**História do Usuário:** Como administrador da plataforma, eu quero criar e gerenciar múltiplas organizações inquilinas, para que eu possa oferecer serviços whitelabel para diferentes clientes.

#### Critérios de Aceitação

1. QUANDO um administrador criar um novo inquilino ENTÃO o sistema DEVE gerar um identificador único e configuração para o inquilino
2. QUANDO um inquilino for criado ENTÃO o sistema DEVE inicializar configurações padrão de marca e isolamento de banco de dados
3. QUANDO visualizar a lista de inquilinos ENTÃO o sistema DEVE exibir todos os inquilinos ativos com seu status e resumo de configuração
4. SE um inquilino for desativado ENTÃO o sistema DEVE impedir acesso aos recursos desse inquilino preservando os dados

### Requisito 2

**História do Usuário:** Como administrador de inquilino, eu quero personalizar a marca e aparência da minha organização, para que a plataforma reflita a identidade da minha empresa.

#### Critérios de Aceitação

1. QUANDO acessar configurações de marca ENTÃO o sistema DEVE permitir upload de logos personalizados, cores e estilos
2. QUANDO a marca for atualizada ENTÃO o sistema DEVE aplicar as mudanças em todas as páginas específicas do inquilino imediatamente
3. QUANDO um usuário visitar o domínio do inquilino ENTÃO o sistema DEVE exibir a marca personalizada consistentemente
4. SE os assets de marca forem inválidos ENTÃO o sistema DEVE rejeitar o upload e fornecer mensagens de erro claras

### Requisito 3

**História do Usuário:** Como usuário de inquilino, eu quero acessar a plataforma através de uma URL personalizada com slug da minha organização, para que eu tenha uma experiência dedicada e fácil de lembrar.

#### Critérios de Aceitação

1. QUANDO um slug for configurado ENTÃO o sistema DEVE permitir acesso via URL no formato `/org/[slug]`
2. QUANDO acessar via slug ENTÃO o sistema DEVE exibir marca e conteúdo específicos do inquilino
3. QUANDO o slug for inválido ou inexistente ENTÃO o sistema DEVE exibir página de erro 404 personalizada
4. SE o slug já existir ENTÃO o sistema DEVE impedir criação duplicada e sugerir alternativas

### Requisito 4

**História do Usuário:** Como usuário de inquilino, eu quero que os dados da minha organização sejam completamente isolados de outros inquilinos, para que privacidade e segurança sejam mantidas.

#### Critérios de Aceitação

1. QUANDO um usuário realizar qualquer operação ENTÃO o sistema DEVE garantir que o acesso aos dados seja restrito apenas ao seu inquilino
2. QUANDO consultar o banco de dados ENTÃO o sistema DEVE filtrar automaticamente resultados por identificador do inquilino
3. QUANDO criar novos registros ENTÃO o sistema DEVE associá-los automaticamente ao inquilino correto
4. SE uma tentativa de acesso a dados entre inquilinos ocorrer ENTÃO o sistema DEVE bloquear a operação e registrar o evento de segurança

### Requisito 5

**História do Usuário:** Como administrador de inquilino, eu quero configurar minhas próprias chaves de API e integrações, para que eu possa usar meus próprios serviços e não depender das configurações globais da plataforma.

#### Critérios de Aceitação

1. QUANDO acessar configurações do inquilino ENTÃO o sistema DEVE permitir configuração das seguintes variáveis específicas por inquilino:
   - `DATABASE_URL` (obrigatória) - URL do banco de dados dedicado do inquilino
   - `OPENAI_API_KEY` (obrigatória) - Chave da API OpenAI
   - `ANTHROPIC_API_KEY` (obrigatória) - Chave da API Anthropic/Claude
   - `E2B_API_KEY` (obrigatória) - Chave da API E2B para sandboxes
   - `STRIPE_SECRET_KEY` (opcional) - Chave secreta do Stripe para pagamentos
   - `STRIPE_PRICE_ID_BASIC` (opcional) - ID do preço básico no Stripe
   - `STRIPE_PRICE_ID_PRO` (opcional) - ID do preço pro no Stripe
2. QUANDO uma variável obrigatória não estiver configurada ENTÃO o sistema DEVE impedir que o inquilino acesse funcionalidades que dependem dessa integração
3. QUANDO configurar uma chave de API ENTÃO o sistema DEVE validar se a chave é válida fazendo uma chamada de teste
4. QUANDO configurar DATABASE_URL ENTÃO o sistema DEVE validar a conexão e executar migrações automaticamente no banco do inquilino
5. SE uma variável for atualizada ENTÃO o sistema DEVE aplicar a mudança imediatamente para aquele inquilino específico

### Requisito 6

**História do Usuário:** Como administrador da plataforma, eu quero oferecer diferentes planos de assinatura para inquilinos, para que eu possa monetizar a plataforma com um modelo SaaS recorrente.

#### Critérios de Aceitação

1. QUANDO um inquilino se cadastrar ENTÃO o sistema DEVE oferecer 2 planos de assinatura mensal:
   - **Self-Service** (R$ 197/mês) - Recursos ilimitados, configuração própria, suporte por documentação
   - **Managed** (R$ 497/mês) - Recursos ilimitados, configuração assistida, suporte dedicado para setup
2. QUANDO o pagamento estiver em atraso ENTÃO o sistema DEVE suspender o acesso do inquilino mantendo os dados
3. QUANDO um inquilino quiser fazer upgrade/downgrade ENTÃO o sistema DEVE permitir mudança de plano com cobrança proporcional
4. SE o inquilino cancelar a assinatura ENTÃO o sistema DEVE manter os dados por 30 dias antes da exclusão definitiva
