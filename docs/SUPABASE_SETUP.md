# Integração com Supabase

Este projeto agora suporta integração completa com Supabase para autenticação e banco de dados.

## 🚀 Configuração

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Aguarde a criação do banco de dados

### 2. Configurar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

**Onde encontrar essas informações:**
- Vá para Settings > API no dashboard do Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role secret key

### 3. Configurar OAuth Providers (Opcional)

Para habilitar login social:

#### Google OAuth
1. Vá para Authentication > Providers > Google
2. Ative o provider
3. Configure Client ID e Client Secret do Google Console

#### GitHub OAuth
1. Vá para Authentication > Providers > GitHub
2. Ative o provider
3. Configure Client ID e Client Secret do GitHub

### 4. Configurar Redirect URLs

No dashboard do Supabase (Authentication > URL Configuration):

**Site URL:** `http://localhost:3000` (desenvolvimento)

**Redirect URLs:**
- `http://localhost:3000/api/auth/callback`
- `https://seudominio.com/api/auth/callback` (produção)

## 📱 Como usar

### Autenticação

#### Login/Registro via Email
```tsx
import { useSupabase } from '@/hooks/useSupabase'

function LoginComponent() {
  const { signIn, signUp } = useSupabase()
  
  const handleLogin = async () => {
    const { error } = await signIn(email, password)
    if (error) console.error(error)
  }
  
  const handleRegister = async () => {
    const { error } = await signUp(email, password)
    if (error) console.error(error)
  }
}
```

#### Login via OAuth
```tsx
const { signInWithOAuth } = useSupabase()

const handleGoogleLogin = () => {
  signInWithOAuth('google')
}
```

#### Verificar usuário logado
```tsx
const { user, loading } = useSupabase()

if (loading) return <div>Carregando...</div>
if (!user) return <div>Não logado</div>

return <div>Olá, {user.email}!</div>
```

### Server Components

```tsx
import { getUser } from '@/lib/supabase/auth'

export default async function ProtectedPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Página protegida</div>
}
```

### Operações de Banco de Dados

#### Client-side
```tsx
import { useDatabase } from '@/lib/supabase/database'

function ProfileComponent() {
  const { getProfile, updateProfile } = useDatabase()
  
  const loadProfile = async () => {
    const profile = await getProfile(userId)
    setProfile(profile)
  }
}
```

#### Server-side
```tsx
import { getProfile, updateProfile } from '@/lib/supabase/database'

export async function GET() {
  const profile = await getProfile(userId)
  return Response.json(profile)
}
```

### Real-time subscriptions
```tsx
import { useDatabase } from '@/lib/supabase/database'

function RealtimeComponent() {
  const { subscribeToProfile } = useDatabase()
  
  useEffect(() => {
    const subscription = subscribeToProfile(userId, (payload) => {
      console.log('Profile updated:', payload)
    })
    
    return () => subscription.unsubscribe()
  }, [])
}
```

## 🛡️ Middleware e Proteção de Rotas

O middleware está configurado para:

- Proteger rotas que começam com `/supabase/` usando autenticação Supabase
- Manter compatibilidade com Clerk para outras rotas
- Permitir acesso público às páginas de login/registro

### Proteger uma nova rota:
1. Crie a rota em `/app/supabase/sua-rota/`
2. O middleware automaticamente protegerá a rota
3. Use `getUser()` ou `requireAuth()` no server component

## 📊 Estrutura de Banco (Exemplo)

Exemplo de tabela `profiles`:

```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Set up Realtime
alter publication supabase_realtime add table profiles;
```

## 🔄 Migração do Clerk

Se você quiser migrar completamente para Supabase:

1. **Backup dos dados:** Exporte usuários do Clerk
2. **Remover Clerk:** Desinstale dependências do Clerk
3. **Atualizar middleware:** Remova lógica do Clerk
4. **Atualizar componentes:** Substitua hooks do Clerk pelos do Supabase
5. **Testar:** Teste todas as funcionalidades

## 🔧 Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que está usando as chaves do projeto correto

### Erro: "User not confirmed"
- Usuário precisa confirmar email
- Configure templates de email no Supabase

### OAuth não funciona
- Verifique redirect URLs
- Confirme configuração do provider
- Teste com modo incógnito

### RLS bloqueia operações
- Configure políticas de Row Level Security
- Use service role key para operações admin

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

## 🎯 Funcionalidades Implementadas

- ✅ Autenticação email/senha
- ✅ OAuth (Google, GitHub)
- ✅ Hooks React para cliente
- ✅ Utilitários server-side
- ✅ Middleware de proteção
- ✅ Componentes de UI
- ✅ Operações de banco
- ✅ Real-time subscriptions
- ✅ Páginas de exemplo
- ✅ Documentação completa

## 🚧 Próximos Passos Sugeridos

1. **Configurar RLS:** Implemente políticas de segurança
2. **Criar tabelas:** Adicione modelos específicos do seu app
3. **Storage:** Configure upload de arquivos
4. **Edge Functions:** Adicione lógica serverless
5. **Webhooks:** Configure eventos automáticos