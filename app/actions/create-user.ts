"use server"

import { supabaseAdmin } from "../lib/supabase-admin"

/**
 * Cria usuário (Auth + tabela usuarios)
 */
export async function createUser(input: {
  nome: string
  email: string
  senha: string
  lojaCodigo: string
  permissoes: string[]
}) {
  try {
    // 0. Verificar se já existe usuário com o e-mail
    const { data: usuarioExistente } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("email", input.email)
      .single();
    if (usuarioExistente) {
      return { ok: false, message: "E-mail já cadastrado" };
    }
    // 1. Obter loja
    const { data: loja, error: lojaErr } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("codigo", input.lojaCodigo)
      .single()
    if (lojaErr || !loja) throw new Error("Loja não encontrada")
    // 2. Criar no Auth
    const { data: auth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.senha,
      email_confirm: true,
      user_metadata: { nome: input.nome },
    })
    if (authErr) throw authErr
    // 3. Inserir na tabela usuarios
    const { error: insertErr } = await supabaseAdmin.from("usuarios").insert({
      auth_id: auth.user.id,
      nome: input.nome,
      email: input.email,
      loja_id: loja.id,
      permissoes: input.permissoes,
      ativo: true,
    })
    if (insertErr) throw insertErr
    return { ok: true }
  } catch (err: any) {
    console.error("createUser error:", err)
    return { ok: false, message: err.message || "Erro desconhecido" }
  }
}
