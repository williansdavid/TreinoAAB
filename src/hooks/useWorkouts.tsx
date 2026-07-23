import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  num_serie: number;
  reps_alvo: number;
  reps_feitas: number | null;
  carga: number | null;
  rpe: number | null;
  descanso_seg: number;
  concluido: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  ordem: number;
  concluido: boolean;
  exercise?: {
    id: string;
    nome: string;
    grupo_muscular: string;
    equipamento: string | null;
    instrucoes: string | null;
    media_url: string | null;
  };
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_day_id: string | null;
  date: string;
  duracao_min: number | null;
  notas: string | null;
  concluido: boolean;
  created_at: string;
  exercises: WorkoutExercise[];
  planDay?: {
    nome_treino: string | null;
    dia_semana: string;
  };
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          plan_days (nome_treino, dia_semana),
          workout_exercises (
            *,
            exercises (id, nome, grupo_muscular, equipamento, instrucoes, media_url),
            workout_sets (*)
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;

      const formatted = (data || []).map((w: any) => ({
        ...w,
        planDay: w.plan_days,
        exercises: (w.workout_exercises || []).map((we: any) => ({
          ...we,
          exercise: we.exercises,
          sets: (we.workout_sets || []).sort((a: any, b: any) => a.num_serie - b.num_serie),
        })).sort((a: any, b: any) => a.ordem - b.ordem),
      }));

      setWorkouts(formatted);

      // Check for today's workout
      const today = new Date().toISOString().split("T")[0];
      const todayW = formatted.find((w) => w.date === today && !w.concluido);
      setTodayWorkout(todayW || null);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkout = async (planDayId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const today = new Date().toISOString().split("T")[0];

      console.log("[createWorkout] Creating workout for date:", today, "planDayId:", planDayId);

      // Create the workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          date: today,
          plan_day_id: planDayId || null,
        })
        .select()
        .single();

      if (workoutError) {
        console.error("[createWorkout] Error creating workout:", workoutError);
        throw workoutError;
      }

      console.log("[createWorkout] Workout created:", workout.id);

      // If there's a plan day, copy its exercises to the workout
      if (planDayId) {
        console.log("[createWorkout] Fetching plan exercises for planDayId:", planDayId);
        
        const { data: planExercises, error: peError } = await supabase
          .from("plan_exercises")
          .select("*, exercises(*)")
          .eq("plan_day_id", planDayId)
          .order("ordem", { ascending: true });

        if (peError) {
          console.error("[createWorkout] Error fetching plan exercises:", peError);
          throw peError;
        }

        console.log("[createWorkout] Found plan exercises:", planExercises?.length || 0);

        if (planExercises && planExercises.length > 0) {
          // Create workout exercises
          for (const pe of planExercises) {
            console.log("[createWorkout] Adding exercise:", pe.exercise_id, "order:", pe.ordem);
            
            const { data: we, error: weError } = await supabase
              .from("workout_exercises")
              .insert({
                workout_id: workout.id,
                exercise_id: pe.exercise_id,
                ordem: pe.ordem,
              })
              .select()
              .single();

            if (weError) {
              console.error("[createWorkout] Error creating workout exercise:", weError);
              throw weError;
            }

            console.log("[createWorkout] Workout exercise created:", we.id);

            // Create sets for this exercise
            const setsToInsert = Array.from(
              { length: pe.series_padrao || 3 },
              (_, i) => ({
                workout_exercise_id: we.id,
                num_serie: i + 1,
                reps_alvo: pe.reps_padrao || 12,
                carga: pe.carga_padrao || null,
                descanso_seg: pe.descanso_padrao_seg || 60,
              })
            );

            console.log("[createWorkout] Creating sets:", setsToInsert.length);

            const { error: setsError } = await supabase
              .from("workout_sets")
              .insert(setsToInsert);

            if (setsError) {
              console.error("[createWorkout] Error creating sets:", setsError);
              throw setsError;
            }
          }
          
          console.log("[createWorkout] All exercises and sets created successfully");
        }
      }

      await fetchWorkouts();
      return workout;
    } catch (error: any) {
      console.error("[createWorkout] Fatal error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar treino",
        description: error.message,
      });
      return null;
    }
  };

  const updateSet = async (setId: string, updates: Partial<WorkoutSet>) => {
    try {
      const { error } = await supabase
        .from("workout_sets")
        .update(updates)
        .eq("id", setId);

      if (error) throw error;

      // Update local state
      setTodayWorkout((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === setId ? { ...s, ...updates } : s
            ),
          })),
        };
      });

      return true;
    } catch (error: any) {
      console.error("Error updating set:", error);
      return false;
    }
  };

  const completeExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("workout_exercises")
        .update({ concluido: true })
        .eq("id", exerciseId);

      if (error) throw error;

      setTodayWorkout((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, concluido: true } : ex
          ),
        };
      });

      toast({
        title: "Exercício concluído! 💪",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  const reopenExercise = async (exerciseId: string) => {
    try {
      // Reopen the exercise
      const { error: exError } = await supabase
        .from("workout_exercises")
        .update({ concluido: false })
        .eq("id", exerciseId);

      if (exError) throw exError;

      // Also reopen all sets of this exercise
      const { error: setsError } = await supabase
        .from("workout_sets")
        .update({ concluido: false })
        .eq("workout_exercise_id", exerciseId);

      if (setsError) throw setsError;

      setTodayWorkout((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === exerciseId
              ? {
                  ...ex,
                  concluido: false,
                  sets: ex.sets.map((s) => ({ ...s, concluido: false })),
                }
              : ex
          ),
        };
      });

      toast({
        title: "Exercício reaberto",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  const deleteExerciseFromWorkout = async (exerciseId: string) => {
    try {
      // Delete sets first (foreign key constraint)
      const { error: setsError } = await supabase
        .from("workout_sets")
        .delete()
        .eq("workout_exercise_id", exerciseId);

      if (setsError) throw setsError;

      // Delete the exercise
      const { error: exError } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("id", exerciseId);

      if (exError) throw exError;

      setTodayWorkout((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
        };
      });

      toast({
        title: "Exercício removido",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover exercício",
        description: error.message,
      });
      return false;
    }
  };

  const finishWorkout = async (workoutId: string, duracao?: number) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({
          concluido: true,
          duracao_min: duracao || null,
        })
        .eq("id", workoutId);

      if (error) throw error;

      toast({
        title: "Treino finalizado! 🎉",
        description: duracao ? `Duração: ${duracao} minutos` : undefined,
      });

      await fetchWorkouts();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return false;
    }
  };

  const addExerciseToWorkout = async (
    workoutId: string,
    exerciseId: string,
    sets: number = 3,
    reps: number = 12
  ) => {
    try {
      // Get current order
      const { data: existing } = await supabase
        .from("workout_exercises")
        .select("ordem")
        .eq("workout_id", workoutId)
        .order("ordem", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].ordem + 1 : 0;

      // Insert workout exercise
      const { data: we, error: weError } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workoutId,
          exercise_id: exerciseId,
          ordem: nextOrder,
        })
        .select()
        .single();

      if (weError) throw weError;

      // Insert sets
      const setsToInsert = Array.from({ length: sets }, (_, i) => ({
        workout_exercise_id: we.id,
        num_serie: i + 1,
        reps_alvo: reps,
        descanso_seg: 60,
      }));

      const { error: setsError } = await supabase
        .from("workout_sets")
        .insert(setsToInsert);

      if (setsError) throw setsError;

      await fetchWorkouts();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar exercício",
        description: error.message,
      });
      return false;
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return {
    workouts,
    todayWorkout,
    isLoading,
    createWorkout,
    updateSet,
    completeExercise,
    reopenExercise,
    deleteExerciseFromWorkout,
    finishWorkout,
    addExerciseToWorkout,
    refetch: fetchWorkouts,
  };
}
