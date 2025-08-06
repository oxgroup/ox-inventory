# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` or `pnpm dev`
- **Build**: `npm run build` or `pnpm build`
- **Production server**: `npm run start` or `pnpm start`
- **Linting**: `npm run lint` or `pnpm lint`

The project uses pnpm as the package manager (indicated by pnpm-lock.yaml).

## Architecture Overview

This is an **OX Inventory Management System** built with Next.js 15, React 19, and Supabase. The application is a single-page application with multiple screens managed by state routing.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom OX brand colors and Radix UI components
- **Backend**: Supabase (PostgreSQL database, Authentication, RLS)
- **State Management**: React useState for local state
- **UI Library**: shadcn/ui components based on Radix UI primitives

### Core Business Logic

The application manages inventory counting for retail stores with:

1. **Multi-store architecture**: Each user belongs to a specific store (`loja_id`)
2. **Role-based permissions**: Users have different permission levels (visualizar, excluir, etc.)
3. **Inventory lifecycle**: `rascunho` → `em_contagem` → `finalizado` → `conciliado`
4. **Product management**: Products belong to stores and have categories, units, and item codes

### Key Architecture Patterns

**State-based Routing**: The main page (`app/page.tsx`) uses a `telaAtiva` state to switch between different screens:
- `home`: Dashboard with main menu
- `novo`: Create new inventory
- `adicionar`: Add items to inventory  
- `listagem`: List all inventories
- `detalhes`: View/edit inventory details
- `usuarios`: User management (admin only)

**Authentication Flow**: 
- Supabase Auth handles login/logout
- Custom `authService` maps auth users to database users
- User data includes store information and permissions
- Authentication state is managed at the root level

**Data Services**: Located in `app/lib/`:
- `supabase.ts`: Database client and core CRUD operations
- `supabase-admin.ts`: Admin operations (if exists)
- `auth.ts`: Authentication logic and user management

**Component Structure**:
- `app/components/`: Screen-level components (one per major workflow)
- `components/ui/`: Reusable UI components from shadcn/ui
- Each screen component receives user context and callback functions

### Database Schema (Supabase)

Key tables managed via SQL scripts in `/scripts/`:
- `usuarios`: User accounts with store association and permissions
- `lojas`: Store/branch information
- `inventarios`: Inventory counting sessions
- `produtos`: Product catalog per store
- `itens_inventario`: Individual item counts within inventories

**Row Level Security (RLS)**: Implemented to ensure users only access data from their assigned store.

### Styling System

Custom brand colors defined in `tailwind.config.ts`:
- Primary: `ox-yellow` (#fabd07)
- Secondary: `ox-blue` (#3599B8), `ox-blue-light` (#A9C4E5)
- Accent colors: `ox-teal`, `ox-coral`, `ox-lime`, etc.
- Gradient backgrounds using `from-[#A9C4E5] to-[#F4DDAE]`

### Important Configuration Notes

- **Build configuration**: ESLint and TypeScript errors are ignored during builds (`next.config.mjs`)
- **Images**: Unoptimized for deployment flexibility
- **TypeScript**: Strict mode enabled with path mapping (`@/*` to root)
- **Database**: Production Supabase instance with service role key (consider environment variables for production)

### Development Workflow Considerations

1. **Database changes**: Use numbered SQL scripts in `/scripts/` directory
2. **Component creation**: Follow existing patterns in `app/components/`
3. **Styling**: Use existing ox-* color classes and maintain brand consistency
4. **State management**: Follow the centralized state pattern in `page.tsx`
5. **Authentication**: Always check user permissions before showing UI elements or allowing operations

### Recent Important Updates

**Database Access Fix (Script 18)**: 
- Fixed RLS policies for produtos table to allow global access
- All authenticated users can now see active products from all stores
- Resolves issue where some products weren't appearing in search
- Products are now shared across all stores as intended