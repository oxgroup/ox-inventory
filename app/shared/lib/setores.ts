// Constantes de setores unificadas para todo o sistema
// Utilizadas em inventário, requisições e fichas técnicas

export interface Setor {
  id: string
  nome: string
  categoria: SetorCategoria
  emoji: string
  descricao?: string
}

export type SetorCategoria = 'cozinha' | 'bar' | 'estoque' | 'servicos' | 'outros'

// Lista completa de setores do sistema
export const SETORES: Setor[] = [
  // === SETORES DA COZINHA ===
  {
    id: 'prep',
    nome: 'Prep',
    categoria: 'cozinha',
    emoji: '🔪',
    descricao: 'Área de preparação e mise en place'
  },
  {
    id: 'fogao',
    nome: 'Fogão',
    categoria: 'cozinha', 
    emoji: '🔥',
    descricao: 'Área de cocção principal'
  },
  {
    id: 'parrilla',
    nome: 'Parrilla',
    categoria: 'cozinha',
    emoji: '🥩', 
    descricao: 'Grill e churrasqueira'
  },
  {
    id: 'garde_sobremesa',
    nome: 'Garde/Sobremesa',
    categoria: 'cozinha',
    emoji: '🍰',
    descricao: 'Área fria e sobremesas'
  },
  {
    id: 'fritadeira',
    nome: 'Fritadeira',
    categoria: 'cozinha',
    emoji: '🍟',
    descricao: 'Frituras e empanados'
  },
  {
    id: 'pizza',
    nome: 'Pizza',
    categoria: 'cozinha',
    emoji: '🍕',
    descricao: 'Forno de pizza'
  },
  {
    id: 'panif_confeit',
    nome: 'Panif./Confeit.',
    categoria: 'cozinha',
    emoji: '🥖',
    descricao: 'Panificação e confeitaria'
  },

  // === SETORES DE BAR ===
  {
    id: 'bar',
    nome: 'Bar',
    categoria: 'bar',
    emoji: '🍺',
    descricao: 'Bar principal'
  },
  {
    id: 'estoque_bebidas',
    nome: 'Estoque Bebidas',
    categoria: 'bar',
    emoji: '🍾',
    descricao: 'Estoque de bebidas alcoólicas e não alcoólicas'
  },
  {
    id: 'vinhos',
    nome: 'Vinhos',
    categoria: 'bar',
    emoji: '🍷',
    descricao: 'Adega e vinhos especiais'
  },

  // === SETORES DE ESTOQUE ===
  {
    id: 'camara_congelada',
    nome: 'Câmara Congelada',
    categoria: 'estoque',
    emoji: '❄️',
    descricao: 'Produtos congelados (-18°C)'
  },
  {
    id: 'camara_resfriada', 
    nome: 'Câmara Resfriada',
    categoria: 'estoque',
    emoji: '🧊',
    descricao: 'Produtos refrigerados (0-4°C)'
  },
  {
    id: 'dry_aged',
    nome: 'Dry Aged',
    categoria: 'estoque',
    emoji: '🥩',
    descricao: 'Câmara de maturação de carnes'
  },
  {
    id: 'estoque_seco',
    nome: 'Estoque Seco',
    categoria: 'estoque',
    emoji: '📦',
    descricao: 'Produtos secos e não perecíveis'
  },
  {
    id: 'estoque_limpeza',
    nome: 'Estoque Limpeza',
    categoria: 'estoque',
    emoji: '🧽',
    descricao: 'Produtos de limpeza e higienização'
  },

  // === SETORES DE SERVIÇOS ===
  {
    id: 'enxoval',
    nome: 'Enxoval',
    categoria: 'servicos',
    emoji: '🛏️',
    descricao: 'Rouparia e utensílios de mesa'
  },
  {
    id: 'manutencao',
    nome: 'Manutenção',
    categoria: 'servicos',
    emoji: '🔧',
    descricao: 'Ferramentas e materiais de manutenção'
  }
]

// Arrays de nomes para compatibilidade com código existente
export const SETORES_NOMES = SETORES.map(s => s.nome)

// Setores por categoria para filtragem
export const SETORES_POR_CATEGORIA = {
  cozinha: SETORES.filter(s => s.categoria === 'cozinha'),
  bar: SETORES.filter(s => s.categoria === 'bar'),  
  estoque: SETORES.filter(s => s.categoria === 'estoque'),
  servicos: SETORES.filter(s => s.categoria === 'servicos'),
  outros: SETORES.filter(s => s.categoria === 'outros')
}

// Função para buscar setor por nome ou ID
export function buscarSetor(identificador: string): Setor | undefined {
  return SETORES.find(s => 
    s.id === identificador || 
    s.nome === identificador ||
    s.nome.toLowerCase() === identificador.toLowerCase()
  )
}

// Função para obter emoji do setor
export function getSetorEmoji(nomeSetor: string): string {
  const setor = buscarSetor(nomeSetor)
  return setor ? setor.emoji : '📍'
}

// Função para validar se um setor existe
export function isSetorValido(nomeSetor: string): boolean {
  return SETORES.some(s => 
    s.nome === nomeSetor || 
    s.id === nomeSetor ||
    s.nome.toLowerCase() === nomeSetor.toLowerCase()
  )
}

// Para compatibilidade com código existente
export { SETORES_NOMES as SETORES_LISTA }

// Mapeamento de setores macro para setores específicos (para produtos)
export const MAPEAMENTO_SETORES_MACRO = {
  'Cozinha': ['Prep', 'Fogão', 'Parrilla', 'Garde/Sobremesa', 'Fritadeira', 'Pizza', 'Panif./Confeit.'],
  'Bar': ['Bar', 'Estoque Bebidas', 'Vinhos'],
  'Estoque': ['Câmara Congelada', 'Câmara Resfriada', 'Dry Aged', 'Estoque Seco', 'Estoque Limpeza'],
  'Serviços': ['Enxoval', 'Manutenção']
}

// Função para obter setores específicos de um setor macro
export function getSetoresEspecificos(setorMacro: string): string[] {
  return MAPEAMENTO_SETORES_MACRO[setorMacro as keyof typeof MAPEAMENTO_SETORES_MACRO] || []
}

// Interface para filtros de setor
export interface FiltroSetor {
  categoria?: SetorCategoria
  nome?: string
  incluirTodos?: boolean
}

// Função para filtrar setores
export function filtrarSetores(filtro: FiltroSetor): Setor[] {
  let setoresFiltrados = [...SETORES]
  
  if (filtro.categoria) {
    setoresFiltrados = setoresFiltrados.filter(s => s.categoria === filtro.categoria)
  }
  
  if (filtro.nome) {
    const termo = filtro.nome.toLowerCase()
    setoresFiltrados = setoresFiltrados.filter(s => 
      s.nome.toLowerCase().includes(termo) ||
      s.descricao?.toLowerCase().includes(termo)
    )
  }
  
  return setoresFiltrados
}