# CHANGELOG - Treino IA

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2024-01-29

### Adicionado (Baseado no Script Inicial)

#### PWA e Offline
- Configuração completa do PWA com `vite-plugin-pwa`
- Manifest.json com ícones, cores do tema e configuração de standalone
- Service Worker com cache para funcionamento offline
- Ícones PWA (192x192 e 512x512)

#### Autenticação
- Página de redefinição de senha (`/reset-password`)
- Tratamento completo do fluxo de recuperação de senha

#### Histórico e Progresso
- Gráficos de progressão de carga com Recharts
- Visualização de volume semanal por grupo muscular
- Integração com dados reais do banco de dados
- Filtro por exercício nos gráficos

#### Perfil e LGPD
- Exportação de dados em formato CSV (além de JSON)
- Função de exclusão permanente de conta
- Página de Política de Privacidade (`/privacidade`)
- Página de Termos de Uso (`/termos`)
- Links funcionais nas páginas de Auth e Profile

#### Componentes
- `ProgressChart.tsx` - Componente de gráficos de progresso

### Mantido (Sem Alteração)

#### Core
- ✅ Design system (dark mode, cores fitness, glassmorphism)
- ✅ Navegação inferior (5 abas)
- ✅ Sistema de autenticação email/senha
- ✅ Schema do banco de dados completo
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ Edge function `ai-coach` para geração de planos e orientações

#### Páginas
- ✅ `Auth.tsx` - Login, cadastro, esqueci senha
- ✅ `Onboarding.tsx` - Fluxo de 5 etapas
- ✅ `Home.tsx` - Dashboard com resumo
- ✅ `Workout.tsx` - Execução de treino com séries, cargas, timer
- ✅ `Planning.tsx` - Planejamento semanal com IA

#### Hooks
- ✅ `useProfile` - Gerenciamento de perfil
- ✅ `useExercises` - Listagem de exercícios
- ✅ `useWorkouts` - Treinos e séries
- ✅ `usePlans` - Planos e dias

#### Componentes de Treino
- ✅ `ExerciseCard.tsx` - Cartão de exercício com séries
- ✅ `ExerciseViewer.tsx` - Visualização com IA
- ✅ `AddExerciseSheet.tsx` - Adicionar exercícios

### Migrações e Impactos

- **Nenhuma migração de banco** foi necessária nesta versão
- Todas as novas funcionalidades utilizam o schema existente
- Novos arquivos criados sem impacto em funcionalidades existentes
- Rotas adicionadas: `/reset-password`, `/privacidade`, `/termos`

### Testes de Não Regressão

Os seguintes fluxos foram verificados:
- [x] Login com email/senha
- [x] Cadastro de nova conta
- [x] Onboarding completo (5 etapas)
- [x] Geração de plano com IA
- [x] Iniciar treino do dia
- [x] Registrar série/carga
- [x] Marcar série como concluída
- [x] Visualizar exercício (orientações IA)
- [x] Editar planejamento
- [x] Visualizar histórico
- [x] Exportar dados (JSON/CSV)
- [x] Alternar tema dark/light
- [x] Logout

---

## [1.0.0] - 2024-01-28

### Adicionado

#### Infraestrutura
- Projeto React + Vite + TypeScript
- Integração Supabase (Auth, Database, Edge Functions)
- Design system com Tailwind CSS (cores fitness, glassmorphism)
- Componentes shadcn/ui personalizados

#### Banco de Dados
- Tabelas: profiles, exercises, plans, plan_days, plan_exercises
- Tabelas: workouts, workout_exercises, workout_sets
- Tabelas: pr_records, ai_suggestions
- RLS policies para isolamento de dados por usuário
- Trigger para criação automática de profile
- Seed de exercícios comuns (12 exercícios)

#### Autenticação
- Login com email/senha
- Cadastro com confirmação automática
- Proteção de rotas

#### Páginas
- Auth (login/signup/forgot)
- Onboarding (5 etapas)
- Home (dashboard)
- Workout (treino do dia)
- Planning (planejamento semanal)
- History (histórico)
- Profile (configurações)

#### IA
- Edge function `ai-coach`
- Geração de planos personalizados
- Orientações de execução de exercícios
- Sugestão de progressão de carga

---

## Notas

### Política de Não Regressão
Este projeto segue uma política estrita de não regressão:
- Funcionalidades estáveis não são removidas
- Breaking changes requerem forte justificativa
- Migrações são idempotentes e reversíveis
- Feature flags são usados para mudanças arriscadas

### Compatibilidade
- React 18.3+
- Node.js 18+
- Browsers modernos (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- Android Chrome 90+
