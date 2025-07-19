'use client'

import { useSupabase } from '@/hooks/useSupabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogOut, Mail, User } from 'lucide-react'
import { toast } from 'sonner'

export function UserProfile() {
  const { user, loading, signOut } = useSupabase()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-muted-foreground">Usuário não autenticado</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Perfil do Usuário
        </CardTitle>
        <CardDescription>
          Informações da sua conta Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold">
              {user.user_metadata?.full_name || 'Usuário'}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={user.email_confirmed_at ? 'default' : 'secondary'}>
              {user.email_confirmed_at ? 'Confirmado' : 'Pendente'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">ID:</span>
            <span className="text-xs text-muted-foreground font-mono">
              {user.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Criado em:</span>
            <span className="text-xs text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </CardContent>
    </Card>
  )
}