import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Calendar,
  Plus,
  Dumbbell,
  Settings,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePlans } from "@/hooks/usePlans";
import { AddExerciseSheet } from "@/components/workout/AddExerciseSheet";
import { CreatePlanSheet } from "@/components/planning/CreatePlanSheet";
import { WeeklyGrid } from "@/components/planning/WeeklyGrid";
import { DayExercisesList } from "@/components/planning/DayExercisesList";
import { WorkoutMigrationDialog } from "@/components/planning/WorkoutMigrationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Planning() {
  const navigate = useNavigate();
  const { needsOnboarding } = useProfile();
  const { 
    activePlan, 
    isLoading, 
    createPlan, 
    addExerciseToPlanDay, 
    removeExerciseFromPlanDay,
    updatePlanExercise,
    moveWorkoutToDay,
    swapWorkouts,
    addDayToPlan,
    removeDayFromPlan,
    migrateWorkout,
    refetch,
    DIAS_SEMANA,
    DIAS_LABELS,
  } = usePlans();

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [selectedNewDay, setSelectedNewDay] = useState<string | null>(null);

  // Redirect to onboarding if needed
  if (needsOnboarding) {
    navigate("/onboarding");
    return null;
  }

  const handleAddExerciseToDay = async (exerciseId: string) => {
    if (!selectedDayId) return false;
    const success = await addExerciseToPlanDay(selectedDayId, exerciseId);
    if (success) {
      setShowAddExercise(false);
    }
    return success;
  };

  const handleRemoveExercise = async (planExerciseId: string) => {
    return removeExerciseFromPlanDay(planExerciseId);
  };

  const handleUpdateExercise = async (
    exerciseId: string,
    params: { series: number; reps: number; descanso: number; carga?: number | null; observacoes?: string }
  ) => {
    return updatePlanExercise(exerciseId, {
      series_padrao: params.series,
      reps_padrao: params.reps,
      descanso_padrao_seg: params.descanso,
      carga_padrao: params.carga,
      observacoes: params.observacoes,
    });
  };

  const handleMoveWorkout = async (fromDayId: string, toDayName: string) => {
    return moveWorkoutToDay(fromDayId, toDayName);
  };

  const handleSwapWorkouts = async (dayId1: string, dayId2: string) => {
    return swapWorkouts(dayId1, dayId2);
  };

  const handleAddDay = async () => {
    if (!selectedNewDay) return;
    await addDayToPlan(selectedNewDay, newDayName || "Treino");
    setShowAddDay(false);
    setNewDayName("");
    setSelectedNewDay(null);
  };

  const selectedDay = activePlan?.days.find((d) => d.id === selectedDayId);
  
  // Get available days (days without workouts)
  const usedDays = activePlan?.days.map((d) => d.dia_semana) || [];
  const availableDays = DIAS_SEMANA.filter((d) => !usedDays.includes(d));

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-display font-bold mb-2">
          Planejamento Semanal
        </h1>
        <p className="text-muted-foreground">
          {activePlan 
            ? `${activePlan.days.length} dias de treino configurados`
            : "Configure seu plano de treino"}
        </p>
      </header>

      <main className="px-6 space-y-6 pb-32">
        {/* Create Plan Card */}
        <section className="animate-slide-up">
          <div className="bg-card rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {activePlan ? "Criar novo plano" : "Monte seu plano de treino"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {activePlan 
                    ? "Crie um novo plano com IA ou manualmente."
                    : "Use a IA para gerar um plano personalizado ou crie manualmente."}
                </p>
                <Button 
                  variant="gradient" 
                  size="sm"
                  onClick={() => setShowCreatePlan(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {activePlan ? "Novo Plano" : "Criar Plano"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {activePlan ? (
          <>
            {/* Plan Name */}
            <section className="animate-slide-up stagger-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold">
                  {activePlan.nome}
                </h2>
                <div className="flex gap-2">
                  {activePlan.days.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMigration(true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Migrar
                    </Button>
                  )}
                  {availableDays.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDay(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Dia
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Weekly Grid with Drag & Drop */}
            <section className="animate-slide-up stagger-2">
              <p className="text-sm text-muted-foreground mb-3">
                Arraste os treinos para reorganizar os dias da semana
              </p>
              <WeeklyGrid
                days={activePlan.days}
                allDays={DIAS_SEMANA}
                daysLabels={DIAS_LABELS}
                selectedDayId={selectedDayId}
                onSelectDay={setSelectedDayId}
                onMoveWorkout={handleMoveWorkout}
                onSwapWorkouts={handleSwapWorkouts}
              />
            </section>

            {/* Selected Day Details */}
            {selectedDay && (
              <section className="animate-slide-up">
                <DayExercisesList
                  day={selectedDay}
                  daysLabels={DIAS_LABELS}
                  onAddExercise={() => setShowAddExercise(true)}
                  onRemoveExercise={handleRemoveExercise}
                  onUpdateExercise={handleUpdateExercise}
                />
                
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      removeDayFromPlan(selectedDay.id);
                      setSelectedDayId(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover este dia
                  </Button>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum plano ativo</h2>
            <p className="text-muted-foreground mb-6">
              Crie um plano de treino com ajuda da IA ou configure manualmente.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button variant="gradient" onClick={() => setShowCreatePlan(true)}>
                <Sparkles className="w-5 h-5 mr-2" />
                Criar plano com IA
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePlan(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Criar manualmente
              </Button>
            </div>
          </div>
        )}

        {/* Safety Notice */}
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            💡 Dica: Arraste os treinos entre os dias para reorganizar sua semana.
            Clique em um treino para editar os exercícios.
          </p>
        </div>
      </main>

      {/* Add Exercise Sheet */}
      <AddExerciseSheet
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAdd={handleAddExerciseToDay}
      />

      {/* Create Plan Sheet */}
      <CreatePlanSheet
        isOpen={showCreatePlan}
        onClose={() => setShowCreatePlan(false)}
        onPlanCreated={() => refetch()}
        createPlan={createPlan}
      />

      {/* Add Day Dialog */}
      <Dialog open={showAddDay} onOpenChange={setShowAddDay}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar dia de treino</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dia da semana</label>
              <div className="flex flex-wrap gap-2">
                {availableDays.map((day) => (
                  <Button
                    key={day}
                    variant={selectedNewDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedNewDay(day)}
                  >
                    {DIAS_LABELS[day]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do treino</label>
              <Input
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                placeholder="Ex: Treino A, Peito, Upper..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDay(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDay} disabled={!selectedNewDay}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workout Migration Dialog */}
      {activePlan && (
        <WorkoutMigrationDialog
          isOpen={showMigration}
          onClose={() => setShowMigration(false)}
          workouts={activePlan.days}
          allDays={DIAS_SEMANA}
          daysLabels={DIAS_LABELS}
          onMigrate={migrateWorkout}
        />
      )}
    </div>
  );
}
