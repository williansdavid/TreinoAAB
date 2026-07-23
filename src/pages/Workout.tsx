import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Play, 
  Plus, 
  Clock, 
  Check,
  Loader2,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/usePlans";
import { useWorkouts } from "@/hooks/useWorkouts";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { ExerciseViewer } from "@/components/workout/ExerciseViewer";
import { AddExerciseSheet } from "@/components/workout/AddExerciseSheet";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Workout() {
  const navigate = useNavigate();
  const { needsOnboarding } = useProfile();
  const { activePlan, getTodayPlanDay, DIAS_LABELS } = usePlans();
  const { 
    todayWorkout, 
    isLoading, 
    createWorkout, 
    updateSet, 
    completeExercise,
    reopenExercise,
    deleteExerciseFromWorkout,
    finishWorkout,
    addExerciseToWorkout,
    refetch
  } = useWorkouts();

  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [viewingExercise, setViewingExercise] = useState<{ id: string; name: string } | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const todayPlanDay = getTodayPlanDay();
  
  // Get all available plan days for the selector
  const availableDays = activePlan?.days || [];
  
  // Use selected day or default to today's plan day
  const activePlanDay = selectedDayId 
    ? availableDays.find(d => d.id === selectedDayId) 
    : todayPlanDay;

  // Redirect to onboarding if needed
  useEffect(() => {
    if (needsOnboarding) {
      navigate("/onboarding");
    }
  }, [needsOnboarding, navigate]);

  // Timer
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Set start time when workout exists and not completed
  useEffect(() => {
    if (todayWorkout && !todayWorkout.concluido && !startTime) {
      setStartTime(new Date(todayWorkout.created_at));
    }
  }, [todayWorkout, startTime]);

  const formatElapsedTime = () => {
    const mins = Math.floor(elapsedTime / 60);
    const secs = elapsedTime % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartWorkout = async () => {
    setIsStarting(true);
    await createWorkout(activePlanDay?.id);
    setStartTime(new Date());
    
    // If we have a plan day, add exercises from it
    if (activePlanDay) {
      // Need to refetch to get the new workout
      await refetch();
    }
    setIsStarting(false);
  };

  const handleFinishWorkout = async () => {
    if (!todayWorkout) return;
    
    setIsFinishing(true);
    const durationMin = Math.floor(elapsedTime / 60);
    await finishWorkout(todayWorkout.id, durationMin);
    setIsFinishing(false);
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!todayWorkout) return false;
    return await addExerciseToWorkout(todayWorkout.id, exerciseId);
  };

  const completedCount = todayWorkout?.exercises.filter((e) => e.concluido).length || 0;
  const totalCount = todayWorkout?.exercises.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  // No workout started yet
  if (!todayWorkout) {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <h1 className="text-2xl font-display font-bold mb-2">Treino de Hoje</h1>
        
        {/* Day Selector */}
        {availableDays.length > 0 && (
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">
              <Calendar className="w-4 h-4 inline mr-1" />
              Selecionar treino
            </label>
            <Select
              value={selectedDayId || todayPlanDay?.id || ""}
              onValueChange={(value) => setSelectedDayId(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um treino" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{DIAS_LABELS[day.dia_semana]}</span>
                      <span className="text-muted-foreground">—</span>
                      <span>{day.nome_treino || "Treino"}</span>
                      {day.id === todayPlanDay?.id && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                          Hoje
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activePlanDay ? (
          <>
            <p className="text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{DIAS_LABELS[activePlanDay.dia_semana]}</span>
              {" — "}
              {activePlanDay.nome_treino || "Seu treino está pronto"}
            </p>

            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h3 className="font-semibold mb-4">Exercícios planejados</h3>
              <div className="space-y-3">
                {activePlanDay.exercises.map((pe) => (
                  <div
                    key={pe.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{pe.exercise?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {pe.series_padrao}x{pe.reps_padrao}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {pe.exercise?.grupo_muscular}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="gradient"
              size="xl"
              onClick={handleStartWorkout}
              disabled={isStarting}
              className="w-full"
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar treino
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sem treino planejado</h2>
            <p className="text-muted-foreground text-center mb-6">
              Você não tem um treino programado para hoje.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/planejamento")}>
                Ver planejamento
              </Button>
              <Button variant="gradient" onClick={handleStartWorkout} disabled={isStarting}>
                {isStarting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Treino livre"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Safety disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          ⚠️ As orientações são informativas e não substituem acompanhamento profissional.
        </p>
      </div>
    );
  }

  // Workout in progress or completed
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-display font-bold">
              {todayWorkout.concluido ? "Treino concluído" : "Treino em andamento"}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {todayWorkout.concluido 
                  ? `${todayWorkout.duracao_min || 0}min` 
                  : formatElapsedTime()
                }
              </span>
              <span>{completedCount}/{totalCount} exercícios</span>
            </div>
          </div>
          
{!todayWorkout.concluido && (
  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => setShowCancelConfirm(true)}
      className="text-destructive border-destructive/30 hover:bg-destructive/10"
    >
      Cancelar treino
    </Button>
    <Button onClick={handleFinishWorkout} disabled={isFinishing}>
      {isFinishing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>Finalizar</>
      )}
    </Button>
  </div>
)}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-6 py-4 space-y-4">
        {todayWorkout.exercises.map((we) => (
          <ExerciseCard
            key={we.id}
            workoutExercise={we}
            onUpdateSet={updateSet}
            onCompleteExercise={completeExercise}
            onReopenExercise={reopenExercise}
            onDeleteExercise={deleteExerciseFromWorkout}
            onViewExercise={(id) => 
              setViewingExercise({ id, name: we.exercise?.nome || "" })
            }
          />
        ))}

        {/* Add exercise button */}
        {!todayWorkout.concluido && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowAddExercise(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar exercício
          </Button>
        )}

        {/* Empty state */}
        {todayWorkout.exercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum exercício adicionado ainda
            </p>
            <Button variant="gradient" onClick={() => setShowAddExercise(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar exercício
            </Button>
          </div>
        )}

        {/* Safety disclaimer */}
        <p className="text-xs text-muted-foreground text-center pt-4">
          ⚠️ As orientações são informativas e não substituem acompanhamento profissional.
        </p>
      </div>

      {/* Exercise Viewer Modal */}
      <ExerciseViewer
        exerciseId={viewingExercise?.id || null}
        exerciseName={viewingExercise?.name || ""}
        onClose={() => setViewingExercise(null)}
      />

      {/* Add Exercise Sheet */}
      <AddExerciseSheet
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAdd={handleAddExercise}
      />
{/* Cancel Confirmation */}
<AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancelar treino?</AlertDialogTitle>
      <AlertDialogDescription>
        O treino atual será encerrado e você poderá iniciar um novo.
        O progresso atual não será perdido — fica salvo no histórico.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Voltar</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          setShowCancelConfirm(false);
          await handleFinishWorkout();
        }}
        className="bg-destructive hover:bg-destructive/90"
      >
        Encerrar treino
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>      
    </div>
  );
}
