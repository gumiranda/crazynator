import { createClient } from './server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function getCurrentSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}