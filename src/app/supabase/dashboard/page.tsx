import { UserProfile } from '@/components/auth/UserProfile'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'

export default async function SupabaseDashboard() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Dashboard Supabase</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel integrado com Supabase
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <UserProfile />
          </div>
          
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Recursos Disponíveis</h2>
              <ul className="space-y-2 text-sm">
                <li>✅ Autenticação com email/senha</li>
                <li>✅ Autenticação OAuth (Google, GitHub)</li>
                <li>✅ Gerenciamento de sessão</li>
                <li>✅ Perfil do usuário</li>
                <li>✅ Middleware de proteção</li>
                <li>✅ Integração server-side e client-side</li>
              </ul>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Próximos Passos</h2>
              <ul className="space-y-2 text-sm">
                <li>🔧 Configure suas variáveis de ambiente</li>
                <li>🔧 Configure OAuth providers no Supabase</li>
                <li>🔧 Personalize as políticas RLS</li>
                <li>🔧 Adicione tabelas customizadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}