"use server"

import { supabaseAdmin } from "../lib/supabase-admin"

/**
 * Atualiza dados de um usuário:
 * 1. Valida a loja.
 * 2. Atualiza a tabela `usuarios`.
 * 3. (Opcional) altera a senha no Supabase Auth.
 */
export async function updateUser(
  usuarioId: string,
  input: {
    nome: string
    email: string
    senha?: string
    lojaCodigo: string
    permissoes: string[]
  },
) {
  try {
    // 1. Obter loja
    const { data: loja, error: lojaErr } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("codigo", input.lojaCodigo)
      .single()

    if (lojaErr || !loja) throw new Error("Loja não encontrada")

    // 2. Atualizar usuário na tabela
    const { error: updErr } = await supabaseAdmin
      .from("usuarios")
      .update({
        nome: input.nome,
        email: input.email,
        loja_id: loja.id,
        permissoes: input.permissoes,
      })
      .eq("id", usuarioId)

    if (updErr) throw updErr

    // 3. Buscar auth_id para opcionalmente mudar senha/e-mail no Auth
    const { data: userRow, error: rowErr } = await supabaseAdmin
      .from("usuarios")
      .select("auth_id")
      .eq("id", usuarioId)
      .single()

    if (rowErr) throw rowErr

    if (userRow?.auth_id) {
      // Atualizar metadados / e-mail
      await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, {
        email: input.email,
        user_metadata: { nome: input.nome },
      })
      // Atualizar senha se enviada
      if (input.senha?.trim()) {
        await supabaseAdmin.auth.admin.updateUserById(userRow.auth_id, {
          password: input.senha.trim(),
        })
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error("updateUser error:", err)
    return { ok: false, message: err.message || "Erro desconhecido" }
  }
}
