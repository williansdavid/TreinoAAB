import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  Target
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/usePlans";
import { useWorkouts } from "@/hooks/useWorkouts";
import { cn } from "@/lib/utils";

const DIAS_LABELS: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default function Home() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading, needsOnboarding } = useProfile();
  const { activePlan, getTodayPlanDay, isLoading: plansLoading } = usePlans();
  const { workouts, todayWorkout, isLoading: workoutsLoading } = useWorkouts();

  // Redirect to onboarding if needed
  useEffect(() => {
    if (needsOnboarding) {
      navigate("/onboarding");
    }
  }, [needsOnboarding, navigate]);

  const todayPlanDay = getTodayPlanDay();
  const isLoading = profileLoading || plansLoading || workoutsLoading;

  // Stats
  const thisWeekWorkouts = workouts.filter((w) => {
    const workoutDate = new Date(w.date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutDate >= weekAgo && w.concluido;
  }).length;

  const completedExercisesToday = todayWorkout?.exercises.filter((e) => e.concluido).length || 0;
  const totalExercisesToday = todayWorkout?.exercises.length || todayPlanDay?.exercises.length || 0;

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-display font-bold">
          {profile?.nome || "Atleta"} 👋
        </h1>
      </div>

      <div className="px-6 space-y-6 pb-8">
        {/* Today's workout card */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm opacity-90">Treino de Hoje</span>
            </div>
            
            {todayPlanDay ? (
              <>
                <h2 className="text-xl font-bold mb-1">
                  {todayPlanDay.nome_treino || DIAS_LABELS[todayPlanDay.dia_semana]}
                </h2>
                <p className="text-sm opacity-80 mb-4">
                  {todayPlanDay.exercises.length} exercícios • ~{activePlan?.tempo_por_dia_min || 60}min
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Dia de descanso</h2>
                <p className="text-sm opacity-80 mb-4">
                  Sem treino planejado para hoje
                </p>
              </>
            )}

            {todayWorkout ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/treino")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {todayWorkout.concluido ? "Ver treino concluído" : "Continuar treino"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : todayPlanDay ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/treino")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Iniciar treino
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/planejamento")}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
              >
                Ver planejamento
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{thisWeekWorkouts}</p>
            <p className="text-xs text-muted-foreground">Treinos na semana</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {completedExercisesToday}/{totalExercisesToday}
            </p>
            <p className="text-xs text-muted-foreground">Exercícios hoje</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{activePlan?.dias_semana || 0}x</p>
            <p className="text-xs text-muted-foreground">Por semana</p>
          </div>
        </div>

        {/* Active plan summary */}
        {activePlan ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{activePlan.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {activePlan.dias_semana} dias • {activePlan.tempo_por_dia_min}min/dia
                </p>
              </div>
              <Link to="/planejamento">
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </Link>
            </div>
            <div className="p-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {activePlan.days.map((day) => (
                  <div
                    key={day.id}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[80px]",
                      todayPlanDay?.id === day.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-xs font-medium">
                      {DIAS_LABELS[day.dia_semana]?.slice(0, 3)}
                    </p>
                    <p className="text-xs opacity-80">
                      {day.exercises.length} ex.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Crie seu plano de treino</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A IA vai sugerir uma divisão personalizada baseada nos seus objetivos.
            </p>
            <Button variant="gradient" onClick={() => navigate("/planejamento")}>
              Criar plano com IA
            </Button>
          </div>
        )}

        {/* Safety disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4">
          ⚠️ As orientações são informativas e não substituem acompanhamento profissional.
        </p>
      </div>
    </div>
  );
}
