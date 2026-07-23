import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento: string | null;
  instrucoes: string | null;
  media_url: string | null;
  is_system: boolean;
  variantes: string[];
  created_at: string;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("grupo_muscular")
        .order("nome");

      if (error) throw error;

      setExercises(
        (data || []).map((e) => ({
          ...e,
          variantes: (e.variantes as string[]) || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const getByMuscleGroup = (group: string) => {
    return exercises.filter((e) => e.grupo_muscular === group);
  };

  const muscleGroups = [...new Set(exercises.map((e) => e.grupo_muscular))];

  return {
    exercises,
    isLoading,
    muscleGroups,
    getByMuscleGroup,
    refetch: fetchExercises,
  };
}
