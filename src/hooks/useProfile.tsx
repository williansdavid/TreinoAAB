import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  unidade_peso: "kg" | "lb";
  equipamentos: string[];
  limitacoes: string[];
  objetivo: string | null;
  experiencia: "iniciante" | "intermediario" | "avancado" | null;
  dias_semana: number;
  tempo_por_dia_min: number;
  preferencias: Record<string, any>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          ...data,
          equipamentos: (data.equipamentos as string[]) || [],
          limitacoes: (data.limitacoes as string[]) || [],
          preferencias: (data.preferencias as Record<string, any>) || {},
          unidade_peso: (data.unidade_peso as "kg" | "lb") || "kg",
          experiencia: data.experiencia as Profile["experiencia"],
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas alterações foram salvas.",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    updateProfile,
    refetch: fetchProfile,
    needsOnboarding: !isLoading && profile && !profile.onboarding_completed,
  };
}
