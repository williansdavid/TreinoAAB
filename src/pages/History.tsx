import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Loader2,
} from "lucide-react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useExercises } from "@/hooks/useExercises";
import { ProgressChart } from "@/components/history/ProgressChart";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function History() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "progress" | "prs">("calendar");
  const [selectedExercise, setSelectedExercise] = useState<string>("all");
  
  const { workouts, isLoading } = useWorkouts();
  const { exercises } = useExercises();

  const currentMonthLabel = format(currentDate, "MMMM yyyy", { locale: ptBR });

  // Filter workouts for current month
  const monthWorkouts = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return workouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= start && workoutDate <= end;
    });
  }, [workouts, currentDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const completedWorkouts = monthWorkouts.filter((w) => w.concluido);
    let totalVolume = 0;
    const prs = new Map<string, { value: number; date: string }>();

    completedWorkouts.forEach((w) => {
      w.exercises.forEach((e) => {
        e.sets.forEach((s) => {
          if (s.concluido && s.carga && s.reps_feitas) {
            totalVolume += s.carga * s.reps_feitas;
            
            // Track PRs (max load per exercise)
            const exerciseName = e.exercise?.nome || "Unknown";
            const current = prs.get(exerciseName);
            if (!current || s.carga > current.value) {
              prs.set(exerciseName, { value: s.carga, date: w.date });
            }
          }
        });
      });
    });

    return {
      workoutCount: completedWorkouts.length,
      totalVolume,
      prCount: prs.size,
      prs: Array.from(prs.entries()).map(([exercise, data]) => ({
        exercise,
        value: `${data.value} kg`,
        date: format(new Date(data.date), "dd/MM", { locale: ptBR }),
        type: "1RM",
      })),
    };
  }, [monthWorkouts]);

  // Progress data for charts
  const progressData = useMemo(() => {
    const volumeByDate = new Map<string, number>();
    const loadByExercise = new Map<string, { date: string; value: number }[]>();

    workouts
      .filter((w) => w.concluido)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((w) => {
        let dayVolume = 0;
        w.exercises.forEach((e) => {
          const exerciseName = e.exercise?.nome || "";
          e.sets.forEach((s) => {
            if (s.concluido && s.carga && s.reps_feitas) {
              dayVolume += s.carga * s.reps_feitas;
              
              // Track load progression per exercise
              if (!loadByExercise.has(exerciseName)) {
                loadByExercise.set(exerciseName, []);
              }
              loadByExercise.get(exerciseName)!.push({
                date: w.date,
                value: s.carga,
              });
            }
          });
        });
        
        if (dayVolume > 0) {
          const existing = volumeByDate.get(w.date) || 0;
          volumeByDate.set(w.date, existing + dayVolume);
        }
      });

    return {
      volume: Array.from(volumeByDate.entries()).map(([date, value]) => ({
        date,
        value: Math.round(value),
      })),
      loadByExercise,
    };
  }, [workouts]);

  // Get exercises that have data
  const exercisesWithData = useMemo(() => {
    return Array.from(progressData.loadByExercise.keys());
  }, [progressData.loadByExercise]);

  // Get chart data for selected exercise
  const selectedExerciseData = useMemo(() => {
    if (selectedExercise === "all") {
      return progressData.volume;
    }
    return progressData.loadByExercise.get(selectedExercise) || [];
  }, [selectedExercise, progressData]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "dd MMM", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-display font-bold mb-4">Histórico</h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === "calendar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Calendário
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === "progress"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-1" />
            Progresso
          </button>
          <button
            onClick={() => setActiveTab("prs")}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === "prs"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Trophy className="w-4 h-4 inline-block mr-1" />
            PRs
          </button>
        </div>
      </header>

      <main className="px-6 pb-32">
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-fade-in">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-semibold capitalize">{currentMonthLabel}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="exercise-card border border-border text-center">
                <p className="text-2xl font-bold text-primary">{stats.workoutCount}</p>
                <p className="text-xs text-muted-foreground">Treinos</p>
              </div>
              <div className="exercise-card border border-border text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {formatVolume(stats.totalVolume)}
                </p>
                <p className="text-xs text-muted-foreground">Volume (kg)</p>
              </div>
              <div className="exercise-card border border-border text-center">
                <p className="text-2xl font-bold text-green-500">{stats.prCount}</p>
                <p className="text-xs text-muted-foreground">PRs</p>
              </div>
            </div>

            {/* Recent Workouts */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Treinos Recentes</h3>
              <div className="space-y-3">
                {monthWorkouts.length === 0 ? (
                  <div className="exercise-card border border-border text-center py-8">
                    <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum treino neste mês</p>
                  </div>
                ) : (
                  monthWorkouts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((workout, index) => {
                      const volume = workout.exercises.reduce((acc, e) => {
                        return acc + e.sets.reduce((sAcc, s) => {
                          return sAcc + ((s.carga || 0) * (s.reps_feitas || 0));
                        }, 0);
                      }, 0);
                      
                      return (
                        <div
                          key={workout.id}
                          className="exercise-card border border-border animate-slide-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(workout.date), "MMM", { locale: ptBR })}
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {format(new Date(workout.date), "dd")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">
                                {workout.planDay?.nome_treino || "Treino"}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{workout.duracao_min || "—"} min</span>
                                <span>•</span>
                                <span>{formatVolume(volume)} kg</span>
                                <span>•</span>
                                <span>{workout.exercises.length} ex.</span>
                              </div>
                            </div>
                            {workout.concluido && (
                              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                                <Flame className="w-4 h-4 text-success" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6 animate-fade-in">
            {/* Exercise Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Filtrar por exercício
              </label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Volume Total</SelectItem>
                  {exercisesWithData.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress Chart */}
            <div className="exercise-card border border-border">
              <ProgressChart
                data={selectedExerciseData}
                title={selectedExercise === "all" ? "Volume Total (kg)" : `Carga - ${selectedExercise}`}
                unit="kg"
                type={selectedExercise === "all" ? "bar" : "line"}
              />
            </div>

            {/* Volume by Muscle Group */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Volume por Grupo Muscular</h3>
              <div className="space-y-2">
                {(() => {
                  const volumeByGroup = new Map<string, number>();
                  workouts.forEach((w) => {
                    w.exercises.forEach((e) => {
                      const group = e.exercise?.grupo_muscular || "Outro";
                      e.sets.forEach((s) => {
                        if (s.concluido && s.carga && s.reps_feitas) {
                          const current = volumeByGroup.get(group) || 0;
                          volumeByGroup.set(group, current + s.carga * s.reps_feitas);
                        }
                      });
                    });
                  });
                  
                  const maxVolume = Math.max(...Array.from(volumeByGroup.values()), 1);
                  
                  return Array.from(volumeByGroup.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([group, volume]) => (
                      <div key={group} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-20 truncate">
                          {group}
                        </span>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full transition-all"
                            style={{ width: `${(volume / maxVolume) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {formatVolume(volume)} kg
                        </span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === "prs" && (
          <div className="space-y-6 animate-fade-in">
            {/* PRs Header */}
            <div className="exercise-card border border-warning/30 bg-warning/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">Seus Recordes Pessoais</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.prs.length} PRs registrados • Continue assim! 🔥
                  </p>
                </div>
              </div>
            </div>

            {/* PR List */}
            <div className="space-y-3">
              {stats.prs.length === 0 ? (
                <div className="exercise-card border border-border text-center py-8">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Complete treinos para registrar seus PRs
                  </p>
                </div>
              ) : (
                stats.prs.map((pr, index) => (
                  <div
                    key={index}
                    className="exercise-card border border-border animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{pr.exercise}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pr.type} • {pr.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{pr.value}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
