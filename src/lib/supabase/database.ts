import { createClient } from './server'
import { createClient as createBrowserClient } from './client'

// Server-side database operations
export async function getProfile(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}

export async function createProfile(profile: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }

  return data
}

// Client-side database operations
export function useDatabase() {
  const supabase = createBrowserClient()

  return {
    supabase,
    
    async getProfile(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    },

    async updateProfile(userId: string, updates: any) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      return data
    },

    async createProfile(profile: any) {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        throw error
      }

      return data
    },

    // Real-time subscriptions
    subscribeToProfile(userId: string, callback: (payload: any) => void) {
      return supabase
        .channel(`profile-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          callback
        )
        .subscribe()
    }
  }
}