import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Settings,
  Target,
  Dumbbell,
  AlertTriangle,
  Download,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Edit,
  Trash2,
  FileJson,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useWorkouts } from "@/hooks/useWorkouts";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const OBJETIVO_LABELS: Record<string, string> = {
  hipertrofia: "Ganhar massa muscular",
  forca: "Aumentar força",
  emagrecimento: "Perder gordura",
  condicionamento: "Melhorar condicionamento",
  saude: "Manter a saúde",
};

const EXPERIENCIA_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function Profile() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useProfile();
  const { workouts, isLoading: workoutsLoading } = useWorkouts();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    setIsDark(document.documentElement.classList.contains("dark"));

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo!",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/auth");
  };

  const handleExportJSON = async () => {
    try {
      const exportData = {
        profile,
        workouts,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `treino-ia-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Dados exportados!",
        description: "Arquivo JSON baixado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível exportar os dados.",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV for workouts
      const csvRows: string[] = [];
      csvRows.push("Data,Treino,Exercício,Série,Reps Alvo,Reps Feitas,Carga (kg),RPE,Concluído");

      workouts.forEach((w) => {
        w.exercises.forEach((e) => {
          e.sets.forEach((s) => {
            csvRows.push([
              w.date,
              w.planDay?.nome_treino || "Treino",
              e.exercise?.nome || "",
              s.num_serie,
              s.reps_alvo,
              s.reps_feitas || "",
              s.carga || "",
              s.rpe || "",
              s.concluido ? "Sim" : "Não",
            ].join(","));
          });
        });
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `treino-ia-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Dados exportados!",
        description: "Arquivo CSV baixado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível exportar os dados.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error("User not found");

      // Delete in order of dependencies
      // First get all workout IDs for this user
      const { data: userWorkouts } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", userId);
      
      if (userWorkouts && userWorkouts.length > 0) {
        const workoutIds = userWorkouts.map((w) => w.id);
        
        // Get workout exercise IDs
        const { data: workoutExercises } = await supabase
          .from("workout_exercises")
          .select("id")
          .in("workout_id", workoutIds);
        
        if (workoutExercises && workoutExercises.length > 0) {
          const weIds = workoutExercises.map((we) => we.id);
          await supabase.from("workout_sets").delete().in("workout_exercise_id", weIds);
        }
        
        await supabase.from("workout_exercises").delete().in("workout_id", workoutIds);
      }
      
      await supabase.from("workouts").delete().eq("user_id", userId);
      
      // Delete plan data
      const { data: userPlans } = await supabase
        .from("plans")
        .select("id")
        .eq("user_id", userId);
      
      if (userPlans && userPlans.length > 0) {
        const planIds = userPlans.map((p) => p.id);
        
        const { data: planDays } = await supabase
          .from("plan_days")
          .select("id")
          .in("plan_id", planIds);
        
        if (planDays && planDays.length > 0) {
          const dayIds = planDays.map((d) => d.id);
          await supabase.from("plan_exercises").delete().in("plan_day_id", dayIds);
        }
        
        await supabase.from("plan_days").delete().in("plan_id", planIds);
      }
      
      await supabase.from("plans").delete().eq("user_id", userId);
      await supabase.from("pr_records").delete().eq("user_id", userId);
      await supabase.from("ai_suggestions").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Conta excluída",
        description: "Todos os seus dados foram removidos permanentemente.",
      });
      navigate("/auth");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir conta",
        description: "Entre em contato com o suporte.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = profileLoading || workoutsLoading;

  // Stats
  const totalWorkouts = workouts.filter((w) => w.concluido).length;
  const totalVolume = workouts.reduce((acc, w) => {
    return acc + w.exercises.reduce((eAcc, e) => {
      return eAcc + e.sets.reduce((sAcc, s) => {
        return sAcc + ((s.carga || 0) * (s.reps_feitas || 0));
      }, 0);
    }, 0);
  }, 0);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}k`;
    return vol.toString();
  };

  const menuItems = [
    {
      icon: Target,
      label: "Meus Objetivos",
      description: profile?.objetivo 
        ? OBJETIVO_LABELS[profile.objetivo] || profile.objetivo
        : "Definir metas de treino",
      action: () => navigate("/onboarding"),
    },
    {
      icon: Dumbbell,
      label: "Equipamentos",
      description: profile?.equipamentos?.length 
        ? `${profile.equipamentos.length} tipos disponíveis`
        : "Configurar equipamentos",
      action: () => navigate("/onboarding"),
    },
    {
      icon: AlertTriangle,
      label: "Limitações / Lesões",
      description: profile?.limitacoes?.length 
        ? `${profile.limitacoes.length} limitações registradas`
        : "Nenhuma limitação",
      action: () => navigate("/onboarding"),
    },
    {
      icon: Settings,
      label: "Preferências",
      description: `Unidade: ${profile?.unidade_peso || "kg"}`,
      action: () => {},
    },
  ];

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-display font-bold">Perfil</h1>
      </header>

      <main className="px-6 space-y-6 pb-32">
        {/* User Card */}
        <section className="animate-slide-up">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {profile?.nome || user?.email?.split("@")[0] || "Atleta"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {profile?.experiencia && (
                  <p className="text-xs text-primary mt-1">
                    {EXPERIENCIA_LABELS[profile.experiencia]}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="iconSm" onClick={() => navigate("/onboarding")}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Treinos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{formatVolume(totalVolume)}</p>
                <p className="text-xs text-muted-foreground">Volume (kg)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{profile?.dias_semana || 0}x</p>
                <p className="text-xs text-muted-foreground">Por semana</p>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Toggle */}
        <section className="animate-slide-up stagger-1">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-muted-foreground">
                    {isDark ? "Modo escuro" : "Modo claro"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {isDark ? "Claro" : "Escuro"}
              </Button>
            </div>
          </div>
        </section>

        {/* Menu Items */}
        <section className="space-y-3 animate-slide-up stagger-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </section>

        {/* Export Data */}
        <section className="animate-slide-up stagger-3">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Download className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Exportar Dados</p>
                <p className="text-sm text-muted-foreground">Baixe seus treinos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleExportJSON}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="animate-slide-up stagger-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da Conta
          </Button>
        </section>

        {/* Delete Account */}
        <section className="animate-slide-up stagger-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Excluir Conta Permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente sua 
                  conta e removerá todos os seus dados dos nossos servidores, incluindo 
                  histórico de treinos, planos e configurações.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Privacy */}
        <section className="animate-slide-up stagger-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              <a href="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </a>{" "}
              •{" "}
              <a href="/termos" className="text-primary hover:underline">
                Termos de Uso
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              Treino IA v1.1.0
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
