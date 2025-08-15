import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/shared/lib/supabase-admin'
import { supabase } from '@/app/shared/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, loja_id, permissoes } = await request.json()

    // Validar dados obrigatórios
    if (!nome || !email || !senha || !loja_id) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter o UUID da loja pelo código
    const { data: lojaData, error: lojaError } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("codigo", loja_id)
      .single()

    if (lojaError || !lojaData) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 400 }
      )
    }

    // Criar usuário no Auth usando service_role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authError.message },
        { status: 400 }
      )
    }

    // Criar entrada na tabela usuarios
    const { data: userData, error: userError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_id: authData.user.id,
        nome,
        email,
        loja_id: lojaData.id,
        permissoes,
      })
      .select()
      .single()

    if (userError) {
      // Se falhar ao criar usuário na tabela, remover do Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Erro ao salvar dados do usuário: ' + userError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: userData })

  } catch (error: any) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nome, email, senha, loja_id, permissoes, auth_id } = await request.json()

    // Validar dados obrigatórios
    if (!id || !nome || !email || !loja_id) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter o UUID da loja pelo código
    const { data: lojaData, error: lojaError } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("codigo", loja_id)
      .single()

    if (lojaError || !lojaData) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 400 }
      )
    }

    // Atualizar dados do usuário na tabela
    const { error: userError } = await supabaseAdmin
      .from("usuarios")
      .update({
        nome,
        email,
        loja_id: lojaData.id,
        permissoes,
      })
      .eq("id", id)

    if (userError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário: ' + userError.message },
        { status: 400 }
      )
    }

    // Atualizar senha no Auth se fornecida
    if (senha && auth_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(auth_id, {
        password: senha,
      })

      if (authError) {
        console.error("Erro ao atualizar senha:", authError)
        // Não falhar a operação toda por causa da senha
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id, auth_id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Excluir da tabela usuarios
    const { error: deleteError } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Erro ao excluir usuário: ' + deleteError.message },
        { status: 400 }
      )
    }

    // Excluir do Auth se tiver auth_id
    if (auth_id) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(auth_id)
      if (authError) {
        console.error("Erro ao excluir do Auth:", authError)
        // Não falhar a operação toda
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}