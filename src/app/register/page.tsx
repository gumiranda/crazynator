import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}