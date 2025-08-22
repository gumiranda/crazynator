# Documento de Requisitos

## Introdução

Esta funcionalidade permitirá que os usuários configurem suas próprias chaves de API para os serviços OpenAI e Anthropic, dando-lhes controle sobre o uso e os custos de seus modelos de IA. Os usuários poderão inserir suas chaves de API, selecionar entre os modelos disponíveis e gerenciar seu próprio consumo de serviços de IA diretamente através da interface da aplicação.

## Requisitos

### Requisito 1

**História do Usuário:** Como usuário, quero inserir minha própria chave de API da OpenAI, para que eu possa usar minha própria conta da OpenAI e controlar meus custos de uso.

#### Critérios de Aceitação

1. QUANDO um usuário acessa a página de configurações, ENTÃO o sistema DEVE exibir um campo de entrada para a chave de API da OpenAI
2. QUANDO um usuário insere uma chave de API da OpenAI válida, ENTÃO o sistema DEVE validar o formato da chave e armazená-la de forma segura
3. QUANDO um usuário insere uma chave de API da OpenAI inválida, ENTÃO o sistema DEVE exibir uma mensagem de erro apropriada
4. QUANDO um usuário salva sua chave de API da OpenAI, ENTÃO o sistema DEVE criptografar e armazenar a chave no banco de dados
5. QUANDO um usuário configurou sua chave de API da OpenAI, ENTÃO o sistema DEVE usar esta chave para todas as chamadas da API da OpenAI em vez da chave padrão do sistema

### Requisito 2

**História do Usuário:** Como usuário, quero inserir minha própria chave de API da Anthropic, para que eu possa usar minha própria conta da Anthropic e controlar meus custos de uso.

#### Critérios de Aceitação

1. QUANDO um usuário acessa a página de configurações, ENTÃO o sistema DEVE exibir um campo de entrada para a chave de API da Anthropic
2. QUANDO um usuário insere uma chave de API da Anthropic válida, ENTÃO o sistema DEVE validar o formato da chave e armazená-la de forma segura
3. QUANDO um usuário insere uma chave de API da Anthropic inválida, ENTÃO o sistema DEVE exibir uma mensagem de erro apropriada
4. QUANDO um usuário salva sua chave de API da Anthropic, ENTÃO o sistema DEVE criptografar e armazenar a chave no banco de dados
5. QUANDO um usuário configurou sua chave de API da Anthropic, ENTÃO o sistema DEVE usar esta chave para todas as chamadas da API da Anthropic em vez da chave padrão do sistema

### Requisito 3

**História do Usuário:** Como usuário, quero selecionar qual modelo de IA usar, para que eu possa escolher o modelo que melhor se adapta às minhas necessidades e orçamento.

#### Critérios de Aceitação

1. QUANDO um usuário configurou uma chave de API da OpenAI, ENTÃO o sistema DEVE exibir os modelos da OpenAI disponíveis para seleção
2. QUANDO um usuário configurou uma chave de API da Anthropic, ENTÃO o sistema DEVE exibir os modelos da Anthropic disponíveis para seleção
3. QUANDO um usuário seleciona um modelo, ENTÃO o sistema DEVE salvar essa preferência e usá-la para futuras interações de IA
4. QUANDO um usuário não configurou nenhuma chave de API, ENTÃO o sistema DEVE usar a configuração padrão do sistema
5. QUANDO um usuário altera seu modelo selecionado, ENTÃO o sistema DEVE aplicar a alteração às interações de IA subsequentes

### Requisito 4

**História do Usuário:** Como usuário, quero gerenciar minhas configurações de chave de API, para que eu possa atualizar ou remover minhas chaves quando necessário.

#### Critérios de Aceitação

1. QUANDO um usuário visualiza suas configurações de chave de API, ENTÃO o sistema DEVE exibir versões mascaradas de suas chaves armazenadas
2. QUANDO um usuário deseja atualizar uma chave de API, ENTÃO o sistema DEVE permitir que ele insira uma nova chave e a valide
3. QUANDO um usuário deseja remover uma chave de API, ENTÃO o sistema DEVE permitir que ele exclua a chave e reverta para os padrões do sistema
4. QUANDO um usuário remove uma chave de API, ENTÃO o sistema DEVE excluir a chave do armazenamento de forma segura
5. QUANDO um usuário removeu todas as chaves de API personalizadas, ENTÃO o sistema DEVE voltar a usar as chaves padrão do sistema

### Requisito 5

**História do Usuário:** Como usuário, quero que minhas chaves de API sejam armazenadas de forma segura, para que minhas credenciais fiquem protegidas contra acesso não autorizado.

#### Critérios de Aceitação

1. QUANDO um usuário insere uma chave de API, ENTÃO o sistema DEVE criptografar a chave antes de armazená-la no banco de dados
2. QUANDO o sistema precisa usar uma chave de API, ENTÃO ele DEVE descriptografar a chave apenas na memória durante a chamada da API
3. AO exibir chaves de API na interface do usuário, ENTÃO o sistema DEVE mostrar apenas versões mascaradas (por exemplo, "sk-...xyz123")
4. QUANDO a sessão de um usuário expira, ENTÃO o sistema NÃO DEVE armazenar em cache as chaves de API descriptografadas
5. SE houver uma violação de segurança, ENTÃO as chaves de API armazenadas DEVEM permanecer criptografadas e inutilizáveis sem a chave de descriptografia

### Requisito 6

**História do Usuário:** Como usuário, quero ver qual modelo estou usando atualmente, para que eu possa entender qual serviço de IA está processando minhas solicitações.

#### Critérios de Aceitação

1. QUANDO um usuário está interagindo com a IA, ENTÃO o sistema DEVE exibir qual modelo está sendo usado no momento
2. QUANDO um usuário alterna entre diferentes modelos configurados, ENTÃO o sistema DEVE atualizar a exibição para mostrar o modelo ativo
3. QUANDO um usuário tem várias chaves de API configuradas, ENTÃO o sistema DEVE indicar claramente qual provedor de serviço e modelo está ativo
4. QUANDO um usuário está usando as chaves padrão do sistema, ENTÃO o sistema DEVE indicar isso na exibição do modelo
5. QUANDO uma resposta de IA é gerada, ENTÃO o sistema DEVE incluir metadados sobre qual modelo foi usado