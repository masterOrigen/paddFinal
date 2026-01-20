import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://stnwcwzhazopsphgzkvl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bndjd3poYXpvcHNwaGd6a3ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MjY1MywiZXhwIjoyMDg0NDE4NjUzfQ.JJgSUKWpfm-IB37vtWsGsu9Z_37Mot8yW8oVnFC2iy4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(60000) // 60 segundos de timeout
      });
    }
  },
  realtime: {
    timeout: 30000
  }
})

