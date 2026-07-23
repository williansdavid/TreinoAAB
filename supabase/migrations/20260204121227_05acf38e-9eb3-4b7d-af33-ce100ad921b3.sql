-- Add target load column to plan_exercises for storing default load per exercise
ALTER TABLE public.plan_exercises 
ADD COLUMN IF NOT EXISTS carga_padrao numeric NULL;

COMMENT ON COLUMN public.plan_exercises.carga_padrao IS 'Default target load/weight in kg for this exercise';