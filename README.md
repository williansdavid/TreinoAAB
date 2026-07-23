# Treino IA

Aplicativo PWA de treino de academia com assistência de IA, desenvolvido em português do Brasil.

## 🎯 Funcionalidades

### Core
- ✅ **Autenticação** - Login com email/senha, recuperação de senha
- ✅ **Onboarding** - Coleta de objetivos, experiência, equipamentos e limitações
- ✅ **Treino do Dia** - Registro de séries, cargas, repetições e RPE
- ✅ **Planejamento** - Divisão semanal com sugestão de IA
- ✅ **Histórico** - Calendário, gráficos de progresso e PRs
- ✅ **Perfil** - Configurações, exportação de dados e exclusão de conta

### IA
- ✅ Geração de plano de treino personalizado
- ✅ Orientações de execução correta de exercícios
- ✅ Sugestão de progressão de carga
- ✅ Adaptação a equipamentos e limitações

### PWA
- ✅ Instalável no celular (Add to Home Screen)
- ✅ Funciona offline (Service Worker)
- ✅ Sincronização automática
- ✅ Dark/Light mode

## 🛠️ Stack Técnica

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **IA**: Lovable AI Gateway (Gemini)
- **Gráficos**: Recharts
- **PWA**: vite-plugin-pwa

## 📁 Estrutura

```
src/
├── components/
│   ├── history/       # Componentes de histórico
│   ├── layout/        # Layout e navegação
│   ├── ui/            # Componentes shadcn/ui
│   └── workout/       # Componentes de treino
├── hooks/             # Hooks customizados (useProfile, useWorkouts, etc.)
├── integrations/      # Integrações (Supabase)
└── pages/             # Páginas da aplicação

supabase/
├── functions/         # Edge Functions (ai-coach)
└── migrations/        # Migrações do banco
```

## 🚀 Setup Local

```bash
# Clone o repositório
git clone [repo-url]
cd treino-ia

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Execute em modo desenvolvimento
npm run dev
```

## 📱 Build PWA

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🗄️ Schema do Banco

- `profiles` - Dados do perfil do usuário
- `exercises` - Catálogo de exercícios
- `plans` / `plan_days` / `plan_exercises` - Planos de treino
- `workouts` / `workout_exercises` / `workout_sets` - Registros de treino
- `pr_records` - Recordes pessoais
- `ai_suggestions` - Sugestões da IA

## 🔐 Segurança

- Row Level Security (RLS) em todas as tabelas
- Isolamento de dados por usuário
- Senhas com hash (Supabase Auth)
- LGPD: Política de Privacidade e Termos de Uso

## ⚠️ Aviso

As orientações fornecidas pelo Treino IA são **informativas** e **não substituem acompanhamento profissional**. Interrompa em caso de dor e procure um especialista.

## 📝 Licença

Este projeto é privado e proprietário.
