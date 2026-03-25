import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
  }
})

// On remet les fonctions dont ton app a besoin pour compiler
export const getClientId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('client_id')
  }
  return null
}

export const getParametres = async (clientId) => {
  const { data } = await supabase
    .from('parametres')
    .select('*')
    .eq('client_id', clientId)
    .single()
  return data
}
