-- =============================================
-- TREINO IA - DATABASE SCHEMA
-- =============================================

-- 1) PROFILES TABLE (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  unidade_peso TEXT DEFAULT 'kg' CHECK (unidade_peso IN ('kg', 'lb')),
  equipamentos JSONB DEFAULT '[]'::jsonb,
  limitacoes JSONB DEFAULT '[]'::jsonb,
  objetivo TEXT,
  experiencia TEXT CHECK (experiencia IN ('iniciante', 'intermediario', 'avancado')),
  dias_semana INTEGER DEFAULT 3 CHECK (dias_semana BETWEEN 1 AND 7),
  tempo_por_dia_min INTEGER DEFAULT 60 CHECK (tempo_por_dia_min BETWEEN 15 AND 180),
  preferencias JSONB DEFAULT '{}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2) EXERCISES TABLE (system + user-created)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  grupo_muscular TEXT NOT NULL,
  equipamento TEXT,
  instrucoes TEXT,
  media_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT false,
  variantes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system exercises" ON public.exercises
  FOR SELECT USING (is_system = true OR auth.uid() = created_by);

CREATE POLICY "Users can create own exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can update own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Users can delete own exercises" ON public.exercises
  FOR DELETE USING (auth.uid() = created_by AND is_system = false);

-- 3) PLANS TABLE
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dias_semana INTEGER NOT NULL CHECK (dias_semana BETWEEN 1 AND 7),
  tempo_por_dia_min INTEGER NOT NULL CHECK (tempo_por_dia_min BETWEEN 15 AND 180),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans" ON public.plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON public.plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON public.plans
  FOR DELETE USING (auth.uid() = user_id);

-- 4) PLAN_DAYS TABLE
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')),
  ordem INTEGER NOT NULL DEFAULT 0,
  nome_treino TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan days" ON public.plan_days
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_days.plan_id AND plans.user_id = auth.uid())
  );

CREATE POLICY "Users can create own plan days" ON public.plan_days
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_days.plan_id AND plans.user_id = auth.uid())
  );

CREATE POLICY "Users can update own plan days" ON public.plan_days
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_days.plan_id AND plans.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own plan days" ON public.plan_days
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.plans WHERE plans.id = plan_days.plan_id AND plans.user_id = auth.uid())
  );

-- 5) PLAN_EXERCISES TABLE
CREATE TABLE public.plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  series_padrao INTEGER DEFAULT 3,
  reps_padrao INTEGER DEFAULT 12,
  descanso_padrao_seg INTEGER DEFAULT 60,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan exercises" ON public.plan_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.plans p ON p.id = pd.plan_id
      WHERE pd.id = plan_exercises.plan_day_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own plan exercises" ON public.plan_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.plans p ON p.id = pd.plan_id
      WHERE pd.id = plan_exercises.plan_day_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan exercises" ON public.plan_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.plans p ON p.id = pd.plan_id
      WHERE pd.id = plan_exercises.plan_day_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan exercises" ON public.plan_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.plan_days pd
      JOIN public.plans p ON p.id = pd.plan_id
      WHERE pd.id = plan_exercises.plan_day_id AND p.user_id = auth.uid()
    )
  );

-- 6) WORKOUTS TABLE (training sessions)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  plan_day_id UUID REFERENCES public.plan_days(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duracao_min INTEGER,
  notas TEXT,
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- 7) WORKOUT_EXERCISES TABLE
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can create own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.user_id = auth.uid())
  );

-- 8) WORKOUT_SETS TABLE
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  num_serie INTEGER NOT NULL,
  reps_alvo INTEGER NOT NULL DEFAULT 12,
  reps_feitas INTEGER,
  carga NUMERIC(6,2),
  rpe NUMERIC(3,1) CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  descanso_seg INTEGER DEFAULT 60,
  concluido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout sets" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own workout sets" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout sets" ON public.workout_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout sets" ON public.workout_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_exercises we
      JOIN public.workouts w ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id AND w.user_id = auth.uid()
    )
  );

-- 9) PR_RECORDS TABLE (Personal Records)
CREATE TABLE public.pr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('1rm', 'rep_max', 'volume')),
  valor NUMERIC(8,2) NOT NULL,
  reps INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PRs" ON public.pr_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own PRs" ON public.pr_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PRs" ON public.pr_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PRs" ON public.pr_records
  FOR DELETE USING (auth.uid() = user_id);

-- 10) AI_SUGGESTIONS TABLE
CREATE TABLE public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  payload JSONB NOT NULL,
  accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI suggestions" ON public.ai_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI suggestions" ON public.ai_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI suggestions" ON public.ai_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

-- 11) TRIGGER for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12) TRIGGER to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13) INDEXES for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_plans_user_id ON public.plans(user_id);
CREATE INDEX idx_plans_ativo ON public.plans(user_id, ativo);
CREATE INDEX idx_plan_days_plan_id ON public.plan_days(plan_id);
CREATE INDEX idx_plan_exercises_plan_day_id ON public.plan_exercises(plan_day_id);
CREATE INDEX idx_workouts_user_id_date ON public.workouts(user_id, date);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_sets_workout_exercise_id ON public.workout_sets(workout_exercise_id);
CREATE INDEX idx_pr_records_user_exercise ON public.pr_records(user_id, exercise_id);
CREATE INDEX idx_exercises_grupo ON public.exercises(grupo_muscular);

-- 14) SEED: System exercises
INSERT INTO public.exercises (nome, grupo_muscular, equipamento, instrucoes, is_system, variantes) VALUES
('Agachamento Livre', 'Pernas', 'Barra', 'Posicione a barra nas costas superiores. Pés na largura dos ombros. Desça controladamente até as coxas ficarem paralelas ao chão. Mantenha o core ativado e joelhos alinhados com os pés.', true, '["Agachamento Goblet", "Agachamento Smith", "Agachamento Frontal"]'::jsonb),
('Supino Reto', 'Peito', 'Barra', 'Deite no banco com os pés firmes no chão. Pegada um pouco mais larga que os ombros. Desça a barra até o peito e empurre de volta. Mantenha as escápulas retraídas.', true, '["Supino com Halteres", "Supino Inclinado", "Flexão"]'::jsonb),
('Remada Curvada', 'Costas', 'Barra', 'Incline o tronco a 45 graus, joelhos levemente flexionados. Puxe a barra em direção ao abdômen, contraindo as escápulas. Desça de forma controlada.', true, '["Remada com Halter", "Remada Cavalinho", "Remada Baixa"]'::jsonb),
('Levantamento Terra', 'Posterior', 'Barra', 'Pés na largura do quadril. Agache, pegue a barra com pegada mista ou pronada. Levante estendendo quadris e joelhos simultaneamente. Mantenha a coluna neutra.', true, '["Levantamento Terra Romeno", "Stiff", "Terra Sumo"]'::jsonb),
('Desenvolvimento Militar', 'Ombros', 'Barra', 'Em pé, barra na altura dos ombros. Empurre para cima até extensão completa dos braços. Desça controladamente até a altura dos ombros.', true, '["Desenvolvimento com Halteres", "Arnold Press", "Elevação Frontal"]'::jsonb),
('Puxada na Frente', 'Costas', 'Cabo', 'Sentado, pegada um pouco mais larga que os ombros. Puxe a barra até a altura do peito, contraindo as escápulas. Retorne de forma controlada.', true, '["Puxada Supinada", "Puxada Neutra", "Pull-up"]'::jsonb),
('Rosca Direta', 'Bíceps', 'Barra', 'Em pé, barra com pegada supinada na largura dos ombros. Flexione os cotovelos trazendo a barra até os ombros. Desça controladamente sem balançar o corpo.', true, '["Rosca Alternada", "Rosca Martelo", "Rosca Scott"]'::jsonb),
('Tríceps Testa', 'Tríceps', 'Barra EZ', 'Deitado no banco, barra acima do peito. Flexione apenas os cotovelos, descendo a barra até próximo à testa. Estenda os braços de volta.', true, '["Tríceps Pulley", "Tríceps Francês", "Mergulho"]'::jsonb),
('Flexão de Braço', 'Peito', 'Peso Corporal', 'Mãos na largura dos ombros, corpo reto. Desça o peito até próximo ao chão. Empurre de volta mantendo o core ativado.', true, '["Flexão Inclinada", "Flexão Diamante", "Flexão com Apoio"]'::jsonb),
('Remada Baixa', 'Costas', 'Cabo', 'Sentado, pés apoiados, joelhos levemente flexionados. Puxe o triângulo até o abdômen, apertando as escápulas. Retorne estendendo os braços.', true, '["Remada Unilateral", "Remada com Halter", "Remada Curvada"]'::jsonb),
('Afundo', 'Pernas', 'Halteres', 'Em pé, dê um passo à frente. Desça até o joelho traseiro quase tocar o chão. Retorne à posição inicial alternando as pernas.', true, '["Afundo Búlgaro", "Afundo Reverso", "Passada"]'::jsonb),
('Elevação Lateral', 'Ombros', 'Halteres', 'Em pé, halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros, cotovelos levemente flexionados. Desça controladamente.', true, '["Elevação Lateral no Cabo", "Elevação Frontal", "Crucifixo Inverso"]'::jsonb),
('Leg Press', 'Pernas', 'Máquina', 'Posicione os pés na plataforma na largura dos ombros. Desça controladamente flexionando os joelhos até 90 graus. Empurre de volta sem travar os joelhos.', true, '["Agachamento Hack", "Agachamento Livre", "Extensora"]'::jsonb),
('Cadeira Extensora', 'Quadríceps', 'Máquina', 'Sentado, tornozelos sob o apoio. Estenda as pernas completamente contraindo o quadríceps. Retorne controladamente.', true, '["Agachamento", "Leg Press", "Afundo"]'::jsonb),
('Mesa Flexora', 'Posterior', 'Máquina', 'Deitado de bruços, tornozelos sob o apoio. Flexione os joelhos trazendo os calcanhares em direção aos glúteos. Retorne controladamente.', true, '["Stiff", "Terra Romeno", "Good Morning"]'::jsonb),
('Panturrilha em Pé', 'Panturrilha', 'Máquina', 'Em pé, ombros sob os apoios. Suba na ponta dos pés contraindo a panturrilha. Desça até sentir alongamento.', true, '["Panturrilha Sentado", "Panturrilha no Leg Press", "Panturrilha Livre"]'::jsonb);