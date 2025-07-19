'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/hooks/useSupabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Github, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithOAuth } = useSupabase()
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Login realizado com sucesso!')
        router.push('/')
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Entre na sua conta para acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <Separator />

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('google')}
          >
            <Mail className="mr-2 h-4 w-4" />
            Continuar com Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOAuthLogin('github')}
          >
            <Github className="mr-2 h-4 w-4" />
            Continuar com GitHub
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}