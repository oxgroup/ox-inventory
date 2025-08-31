# 🏗️ Módulo Setores - Análise e Implementação

Este documento apresenta a análise completa e as sugestões para implementar o **Módulo Setores** no sistema OX Inventory.

## 📊 Análise da Estrutura Atual

### **Dados Existentes por Módulo**

#### 🍳 **Fichas Técnicas**
- **Integração**: ✅ **Já implementado**
- **Campo**: `setores` (JSONB array) na tabela `pratos`
- **Funcionalidade**: Múltiplos setores por ficha técnica
- **Serviços**: `setoresFichasService` disponível

#### 📋 **Requisições**
- **Campo atual**: `setor_solicitante` (string) na tabela `requisicoes`
- **Integração**: ⚠️ **Parcial** - apenas setor solicitante
- **Necessário**: Identificar requisições **para** um setor via produtos

#### 📦 **Inventários**
- **Campo atual**: `setor` (string) na tabela `inventarios`
- **Integração**: ✅ **Direto** - um setor por inventário
- **Funcionalidade**: Inventários são sempre de um setor específico

#### 🎯 **Produtos**
- **Campo atual**: `setor_1` (string) na tabela `produtos`
- **Integração**: ✅ **Direto** - produtos pertencem a setores
- **Uso**: Para identificar requisições destinadas a setores

## 🎯 Proposta do Módulo Setores

### **Funcionalidades Principais**

1. **🏠 Dashboard Geral**: Lista de todos os setores com estatísticas
2. **📊 Dashboard por Setor**: Visão detalhada de um setor específico
3. **🔄 Atividades em Tempo Real**: Timeline de ações por setor
4. **📈 Análises e Relatórios**: Métricas de performance por área

### **Informações Exibidas por Setor**

#### **📋 Fichas Técnicas**
- Total de fichas do setor
- Fichas criadas no mês
- Fichas mais utilizadas

#### **📋 Requisições**
- **Solicitadas PELO setor**: Requisições criadas pelo setor
- **Destinadas AO setor**: Produtos requisitados que pertencem ao setor
- Status das requisições (pendentes, separadas, entregues)

#### **📦 Inventários**
- Total de inventários realizados
- Último inventário e status
- Itens contados por período

## 🏛️ Arquitetura Proposta

### **1. Serviço Backend**
```typescript
// app/shared/lib/setores-dashboard-service.ts
export const setoresDashboardService = {
  // Estatísticas gerais de um setor
  obterEstatisticasSetor(lojaId: string, setor: string),
  
  // Atividades recentes do setor
  obterAtividadesRecentes(lojaId: string, setor: string),
  
  // Requisições do/para o setor
  obterRequisicoesPorSetor(lojaId: string, setor: string),
  
  // Inventários do setor
  obterInventariosPorSetor(lojaId: string, setor: string),
  
  // Resumo completo
  obterResumoSetor(lojaId: string, setor: string)
}
```

### **2. Estrutura de Pastas**
```
app/setores/
├── page.tsx                    # Dashboard geral de setores
├── [setor]/
│   └── page.tsx               # Dashboard específico do setor
└── components/
    ├── lista-setores.tsx      # Grid de setores
    ├── dashboard-setor.tsx    # Dashboard individual
    ├── estatisticas-card.tsx  # Cards de métricas
    ├── atividades-setor.tsx   # Timeline de atividades
    ├── fichas-setor.tsx       # Lista de fichas do setor
    ├── requisicoes-setor.tsx  # Requisições do setor
    └── inventarios-setor.tsx  # Inventários do setor
```

### **3. Páginas e Componentes**

#### **Dashboard Geral (`/setores`)**
- Grid com cards de todos os setores
- Métricas resumidas de cada setor
- Navegação para dashboards específicos
- Filtros por categoria de setor

#### **Dashboard Específico (`/setores/[setor]`)**
- Estatísticas detalhadas do setor
- Atividades recentes
- Links diretos para fichas/requisições/inventários
- Gráficos de evolução temporal

## 📊 Queries e Lógica de Dados

### **Estatísticas por Setor**
```sql
-- Fichas técnicas do setor
SELECT COUNT(*) FROM pratos 
WHERE loja_id = $1 AND setores ? $2 AND ativo = true;

-- Requisições solicitadas pelo setor
SELECT COUNT(*), status FROM requisicoes 
WHERE loja_id = $1 AND setor_solicitante = $2 
GROUP BY status;

-- Requisições PARA o setor (via produtos)
SELECT COUNT(*) FROM itens_requisicao ir
JOIN produtos p ON ir.produto_id = p.id
JOIN requisicoes r ON ir.requisicao_id = r.id
WHERE r.loja_id = $1 AND p.setor_1 = $2;

-- Inventários do setor
SELECT COUNT(*), status FROM inventarios 
WHERE loja_id = $1 AND setor = $2 
GROUP BY status;
```

## 🚀 Plano de Implementação

### **Fase 1: Serviço Backend** (1-2 dias)
1. ✅ Criar `setores-dashboard-service.ts`
2. ✅ Implementar queries para estatísticas
3. ✅ Criar interfaces TypeScript
4. ✅ Testes básicos das funções

### **Fase 2: Dashboard Geral** (1 dia)
1. ✅ Página `/setores/page.tsx`
2. ✅ Componente `ListaSetores`
3. ✅ Cards com métricas básicas
4. ✅ Navegação entre setores

### **Fase 3: Dashboard Específico** (2-3 dias)
1. ✅ Página dinâmica `/setores/[setor]/page.tsx`
2. ✅ Componente `DashboardSetor`
3. ✅ Integração com dados existentes
4. ✅ Timeline de atividades

### **Fase 4: Integrações Avançadas** (2 dias)
1. ✅ Links diretos para fichas filtradas por setor
2. ✅ Links para requisições do setor
3. ✅ Links para inventários do setor
4. ✅ Breadcrumbs e navegação

### **Fase 5: Melhorias e Analytics** (1-2 dias)
1. ✅ Gráficos e visualizações
2. ✅ Filtros temporais
3. ✅ Exportação de relatórios
4. ✅ Performance e otimizações

## 🎨 Design e Interface

### **Cards de Setores**
- Emoji do setor + Nome
- Métricas principais (fichas, requisições, inventários)
- Indicador de última atividade
- Status visual (ativo/inativo)

### **Dashboard Individual**
- Header com emoji e nome do setor
- Grid de estatísticas (4 cards principais)
- Timeline de atividades recentes
- Seções expandíveis para cada módulo

### **Cores e Temas**
- Manter consistência com sistema atual
- Usar emoji como identificador visual
- Cores por categoria de setor

## ⚙️ Configurações Necessárias

### **Menu Principal**
Adicionar novo item no `page.tsx`:
```tsx
<ModuleCard
  title="🏗️ Setores"
  description="Dashboard de atividades por setor"
  icon={<Building className="w-6 h-6" />}
  href="/setores"
/>
```

### **Permissões**
- Todos os usuários podem visualizar setores da sua loja
- Filtragem automática por `loja_id`
- Dados históricos conforme permissões existentes

## 🔄 Integrações com Módulos Existentes

### **Fichas Técnicas**
- ✅ Já implementado: filtrar fichas por setor
- ✅ Componente `FichasPorSetor` já existe
- ✅ Links diretos: `/setores/Prep` → `/fichas-tecnicas?setor=Prep`

### **Requisições** 
- ⚠️ Necessário: filtros por setor solicitante
- ⚠️ Necessário: identificar requisições para setor (via produtos)
- ⚠️ Sugestão: adicionar filtro na listagem existente

### **Inventários**
- ✅ Já implementado: inventários por setor
- ✅ Links diretos: `/setores/Estoque` → `/inventory?setor=Estoque`

### **Produtos**
- ✅ Já implementado: produtos por setor (setor_1)
- ✅ Usado para identificar requisições destinadas ao setor

## 📈 Benefícios Esperados

1. **👥 Para Usuários**:
   - Visão centralizada de cada área
   - Acesso rápido a informações relevantes
   - Melhor organização do trabalho

2. **📊 Para Gestão**:
   - Analytics por setor
   - Identificação de gargalos
   - Planejamento baseado em dados

3. **🔧 Para Sistema**:
   - Aproveitamento da estrutura existente
   - Reutilização de componentes
   - Crescimento orgânico da funcionalidade

## 🎯 Próximos Passos

1. **✅ Implementar serviço backend** com estatísticas básicas
2. **✅ Criar dashboard geral** com lista de setores
3. **✅ Desenvolver dashboard individual** por setor
4. **✅ Integrar com módulos existentes**
5. **✅ Testar e refinar** com feedback dos usuários

---

**📧 Análise Completa por Claude Code**  
*Sistema OX Inventory - Módulo Setores Integrado*