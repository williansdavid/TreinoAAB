import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlanExercise {
  id: string;
  plan_day_id: string;
  exercise_id: string;
  ordem: number;
  series_padrao: number;
  reps_padrao: number;
  descanso_padrao_seg: number;
  carga_padrao: number | null;
  observacoes: string | null;
  exercise?: {
    id: string;
    nome: string;
    grupo_muscular: string;
    equipamento: string | null;
  };
}

export interface PlanDay {
  id: string;
  plan_id: string;
  dia_semana: string;
  ordem: number;
  nome_treino: string | null;
  exercises: PlanExercise[];
}

export interface Plan {
  id: string;
  user_id: string;
  nome: string;
  dias_semana: number;
  tempo_por_dia_min: number;
  ativo: boolean;
  created_at: string;
  days: PlanDay[];
}

const DIAS_SEMANA = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
const DIAS_LABELS: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("plans")
        .select(`
          *,
          plan_days (
            *,
            plan_exercises (
              *,
              exercises (id, nome, grupo_muscular, equipamento)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((p) => ({
        ...p,
        days: (p.plan_days || [])
          .map((d: any) => ({
            ...d,
            exercises: (d.plan_exercises || [])
              .map((pe: any) => ({
                ...pe,
                exercise: pe.exercises,
              }))
              .sort((a: any, b: any) => a.ordem - b.ordem),
          }))
          .sort((a: any, b: any) => a.ordem - b.ordem),
      }));

      setPlans(formatted);
      
      const active = formatted.find((p) => p.ativo);
      setActivePlan(active || null);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlan = async (
    nome: string,
    diasSemana: number,
    tempoPorDia: number,
    days: { 
      dia: string; 
      nome_treino: string;
      exercicios?: { nome: string; series: number; reps: number; descanso_seg: number }[];
    }[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Deactivate other plans
      await supabase
        .from("plans")
        .update({ ativo: false })
        .eq("user_id", user.id);

      // Create new plan
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .insert({
          user_id: user.id,
          nome,
          dias_semana: diasSemana,
          tempo_por_dia_min: tempoPorDia,
          ativo: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create plan days
      const daysToInsert = days.map((d, i) => ({
        plan_id: plan.id,
        dia_semana: d.dia,
        ordem: i,
        nome_treino: d.nome_treino,
      }));

      const { data: insertedDays, error: daysError } = await supabase
        .from("plan_days")
        .insert(daysToInsert)
        .select();

      if (daysError) throw daysError;

      // If AI generated exercises, we need to find or create them and add to plan
      for (let i = 0; i < days.length; i++) {
        const dayData = days[i];
        const insertedDay = insertedDays?.find((d) => d.dia_semana === dayData.dia);
        
        if (dayData.exercicios && dayData.exercicios.length > 0 && insertedDay) {
          for (let j = 0; j < dayData.exercicios.length; j++) {
            const ex = dayData.exercicios[j];
            
            // Try to find existing exercise by name
            let { data: existingExercise } = await supabase
              .from("exercises")
              .select("id")
              .ilike("nome", ex.nome)
              .limit(1)
              .maybeSingle();

            let exerciseId: string;

            if (existingExercise) {
              exerciseId = existingExercise.id;
            } else {
              // Create new exercise
              const { data: newExercise, error: exError } = await supabase
                .from("exercises")
                .insert({
                  nome: ex.nome,
                  grupo_muscular: "geral",
                  created_by: user.id,
                  is_system: false,
                })
                .select("id")
                .single();

              if (exError) {
                console.error("Error creating exercise:", exError);
                continue;
              }
              exerciseId = newExercise.id;
            }

            // Add exercise to plan day
            await supabase.from("plan_exercises").insert({
              plan_day_id: insertedDay.id,
              exercise_id: exerciseId,
              ordem: j,
              series_padrao: ex.series || 3,
              reps_padrao: ex.reps || 12,
              descanso_padrao_seg: ex.descanso_seg || 60,
            });
          }
        }
      }

      toast({
        title: "Plano criado! 🎉",
        description: `${nome} foi ativado com ${days.length} dias de treino.`,
      });

      await fetchPlans();
      return plan;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar plano",
        description: error.message,
      });
      return null;
    }
  };

  const addExerciseToPlanDay = async (
    planDayId: string,
    exerciseId: string,
    series: number = 3,
    reps: number = 12,
    descanso: number = 60
  ) => {
    try {
      // Get current order
      const { data: existing } = await supabase
        .from("plan_exercises")
        .select("ordem")
        .eq("plan_day_id", planDayId)
        .order("ordem", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].ordem + 1 : 0;

      const { error } = await supabase
        .from("plan_exercises")
        .insert({
          plan_day_id: planDayId,
          exercise_id: exerciseId,
          ordem: nextOrder,
          series_padrao: series,
          reps_padrao: reps,
          descanso_padrao_seg: descanso,
        });

      if (error) throw error;

      await fetchPlans();
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

  const removeExerciseFromPlanDay = async (planExerciseId: string) => {
    try {
      const { error } = await supabase
        .from("plan_exercises")
        .delete()
        .eq("id", planExerciseId);

      if (error) throw error;

      await fetchPlans();
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

  const updatePlanExercise = async (
    planExerciseId: string,
    updates: {
      series_padrao?: number;
      reps_padrao?: number;
      descanso_padrao_seg?: number;
      carga_padrao?: number | null;
      observacoes?: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("plan_exercises")
        .update(updates)
        .eq("id", planExerciseId);

      if (error) throw error;

      // Update local state
      setActivePlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((d) => ({
            ...d,
            exercises: d.exercises.map((e) =>
              e.id === planExerciseId ? { ...e, ...updates } : e
            ),
          })),
        };
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

  const moveWorkoutToDay = async (planDayId: string, newDayName: string) => {
    try {
      const { error } = await supabase
        .from("plan_days")
        .update({ dia_semana: newDayName })
        .eq("id", planDayId);

      if (error) throw error;

      toast({
        title: "Treino movido! 📅",
        description: `Treino movido para ${DIAS_LABELS[newDayName]}.`,
      });

      await fetchPlans();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao mover treino",
        description: error.message,
      });
      return false;
    }
  };

  const swapWorkouts = async (dayId1: string, dayId2: string) => {
    try {
      // Get both days
      const day1 = activePlan?.days.find((d) => d.id === dayId1);
      const day2 = activePlan?.days.find((d) => d.id === dayId2);

      if (!day1 || !day2) throw new Error("Dias não encontrados");

      // Swap dia_semana values
      const { error: error1 } = await supabase
        .from("plan_days")
        .update({ dia_semana: day2.dia_semana })
        .eq("id", dayId1);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("plan_days")
        .update({ dia_semana: day1.dia_semana })
        .eq("id", dayId2);

      if (error2) throw error2;

      toast({
        title: "Treinos trocados! 🔄",
        description: `${DIAS_LABELS[day1.dia_semana]} ↔ ${DIAS_LABELS[day2.dia_semana]}`,
      });

      await fetchPlans();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao trocar treinos",
        description: error.message,
      });
      return false;
    }
  };

  const updatePlanDayName = async (planDayId: string, nomeTreino: string) => {
    try {
      const { error } = await supabase
        .from("plan_days")
        .update({ nome_treino: nomeTreino })
        .eq("id", planDayId);

      if (error) throw error;

      setActivePlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((d) =>
            d.id === planDayId ? { ...d, nome_treino: nomeTreino } : d
          ),
        };
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

  const addDayToPlan = async (dayName: string, nomeTreino: string = "Treino") => {
    if (!activePlan) return null;

    try {
      const nextOrdem = activePlan.days.length;

      const { data, error } = await supabase
        .from("plan_days")
        .insert({
          plan_id: activePlan.id,
          dia_semana: dayName,
          ordem: nextOrdem,
          nome_treino: nomeTreino,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Dia adicionado! 📅",
        description: `Treino em ${DIAS_LABELS[dayName]} criado.`,
      });

      await fetchPlans();
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
      return null;
    }
  };

  const removeDayFromPlan = async (planDayId: string) => {
    try {
      // First delete all exercises from this day
      await supabase
        .from("plan_exercises")
        .delete()
        .eq("plan_day_id", planDayId);

      // Then delete the day
      const { error } = await supabase
        .from("plan_days")
        .delete()
        .eq("id", planDayId);

      if (error) throw error;

      toast({
        title: "Dia removido",
      });

      await fetchPlans();
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

  const migrateWorkout = async (
    workoutDayId: string,
    targetDayName: string,
    mode: "copy" | "move" | "replace"
  ) => {
    if (!activePlan) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const sourceDay = activePlan.days.find((d) => d.id === workoutDayId);
      if (!sourceDay) throw new Error("Dia não encontrado");

      // If mode is replace, first remove the existing day in target
      if (mode === "replace") {
        const existingDay = activePlan.days.find(
          (d) => d.dia_semana === targetDayName
        );
        if (existingDay) {
          await supabase
            .from("plan_exercises")
            .delete()
            .eq("plan_day_id", existingDay.id);
          await supabase
            .from("plan_days")
            .delete()
            .eq("id", existingDay.id);
        }
      }

      if (mode === "move") {
        // Just update the day name
        const { error } = await supabase
          .from("plan_days")
          .update({ dia_semana: targetDayName })
          .eq("id", workoutDayId);

        if (error) throw error;

        toast({
          title: "Treino movido! 📅",
          description: `${sourceDay.nome_treino || "Treino"} → ${DIAS_LABELS[targetDayName]}`,
        });
      } else if (mode === "copy" || mode === "replace") {
        // Create a new day with copied exercises
        const nextOrdem = activePlan.days.length;

        const { data: newDay, error: dayError } = await supabase
          .from("plan_days")
          .insert({
            plan_id: activePlan.id,
            dia_semana: targetDayName,
            ordem: nextOrdem,
            nome_treino: sourceDay.nome_treino,
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // Copy exercises
        if (sourceDay.exercises.length > 0) {
          const exercisesToInsert = sourceDay.exercises.map((ex, i) => ({
            plan_day_id: newDay.id,
            exercise_id: ex.exercise_id,
            ordem: i,
            series_padrao: ex.series_padrao,
            reps_padrao: ex.reps_padrao,
            descanso_padrao_seg: ex.descanso_padrao_seg,
            observacoes: ex.observacoes,
          }));

          const { error: exError } = await supabase
            .from("plan_exercises")
            .insert(exercisesToInsert);

          if (exError) throw exError;
        }

        toast({
          title: mode === "copy" ? "Treino copiado! 📋" : "Treino substituído! 🔄",
          description: `${sourceDay.nome_treino || "Treino"} → ${DIAS_LABELS[targetDayName]}`,
        });
      }

      await fetchPlans();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na migração",
        description: error.message,
      });
      return false;
    }
  };

  const getTodayPlanDay = () => {
    if (!activePlan) return null;

    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Sunday
    const diaAtual = DIAS_SEMANA[dayIndex === 0 ? 6 : dayIndex - 1];

    return activePlan.days.find((d) => d.dia_semana === diaAtual) || null;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    activePlan,
    isLoading,
    createPlan,
    addExerciseToPlanDay,
    removeExerciseFromPlanDay,
    updatePlanExercise,
    moveWorkoutToDay,
    swapWorkouts,
    updatePlanDayName,
    addDayToPlan,
    removeDayFromPlan,
    migrateWorkout,
    getTodayPlanDay,
    refetch: fetchPlans,
    DIAS_SEMANA,
    DIAS_LABELS,
  };
}
