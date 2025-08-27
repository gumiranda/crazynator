# Requirements Document

## Introduction

Esta funcionalidade implementa um sistema automático de recriação de sandboxes quando eles expiram. Quando um sandbox expira, o sistema deve automaticamente criar um novo sandbox, atualizar a URL e recarregar o iframe para que o usuário continue trabalhando sem interrupção manual.

## Requirements

### Requirement 1

**User Story:** Como um usuário desenvolvendo em um projeto, eu quero que meu sandbox seja automaticamente recriado quando expirar, para que eu possa continuar trabalhando sem interrupção.

#### Acceptance Criteria

1. WHEN um sandbox expira THEN o sistema SHALL detectar automaticamente a expiração
2. WHEN a expiração é detectada THEN o sistema SHALL iniciar o processo de recriação do sandbox
3. WHEN o novo sandbox é criado THEN o sistema SHALL atualizar a URL do projeto com a nova URL do sandbox
4. WHEN a URL é atualizada THEN o sistema SHALL recarregar o iframe automaticamente
5. WHEN o processo é concluído THEN o usuário SHALL poder continuar trabalhando no novo sandbox sem perda de dados

### Requirement 2

**User Story:** Como um usuário, eu quero ser notificado quando meu sandbox está sendo recriado, para que eu saiba o que está acontecendo durante o processo.

#### Acceptance Criteria

1. WHEN o processo de recriação inicia THEN o sistema SHALL exibir uma notificação informando que o sandbox está sendo recriado
2. WHEN o processo está em andamento THEN o sistema SHALL mostrar um indicador de loading no iframe
3. WHEN o processo é concluído com sucesso THEN o sistema SHALL exibir uma notificação de sucesso
4. IF o processo falha THEN o sistema SHALL exibir uma mensagem de erro com opção de tentar novamente

### Requirement 3

**User Story:** Como um desenvolvedor do sistema, eu quero que o processo de recriação preserve o estado atual do projeto, para que o usuário não perca seu trabalho.

#### Acceptance Criteria

1. WHEN um sandbox vai ser recriado THEN o sistema SHALL salvar o estado atual dos arquivos do projeto
2. WHEN o novo sandbox é criado THEN o sistema SHALL restaurar todos os arquivos do projeto no novo sandbox
3. WHEN a restauração é concluída THEN o sistema SHALL verificar se todos os arquivos foram transferidos corretamente
4. IF algum arquivo não foi transferido THEN o sistema SHALL tentar novamente ou reportar erro específico

### Requirement 4

**User Story:** Como um usuário, eu quero que o sistema detecte automaticamente quando um sandbox expira, para que eu não precise monitorar manualmente o status.

#### Acceptance Criteria

1. WHEN um sandbox está ativo THEN o sistema SHALL monitorar periodicamente seu status de expiração
2. WHEN uma requisição ao sandbox retorna erro de expiração THEN o sistema SHALL marcar o sandbox como expirado
3. WHEN o sistema detecta que um sandbox expirou THEN o sistema SHALL iniciar automaticamente o processo de recriação
4. WHEN múltiplas tentativas de acesso falham THEN o sistema SHALL confirmar a expiração antes de recriar

### Requirement 5

**User Story:** Como um usuário, eu quero que o processo de recriação seja robusto e trate erros adequadamente, para que eu tenha uma experiência confiável.

#### Acceptance Criteria

1. IF a recriação do sandbox falha THEN o sistema SHALL tentar novamente até 3 vezes
2. IF todas as tentativas falharem THEN o sistema SHALL exibir uma mensagem de erro clara com opções de ação
3. WHEN há erro de rede durante a recriação THEN o sistema SHALL aguardar e tentar novamente
4. WHEN o usuário está offline THEN o sistema SHALL pausar o processo e retomar quando a conexão for restaurada
5. IF o processo é interrompido THEN o sistema SHALL permitir que o usuário reinicie manualmente
