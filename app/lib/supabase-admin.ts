import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com chave SERVICE_ROLE
 * - Somente para uso em Server Components / Server Actions
 * - Persistência de sessão desabilitada
 */
export const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})
