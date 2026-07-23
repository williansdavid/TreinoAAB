import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Check,
  Edit,
  Timer,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ExerciseParamsModal } from "@/components/planning/ExerciseParamsModal";
import type { WorkoutExercise, WorkoutSet } from "@/hooks/useWorkouts";

interface TodayWorkoutProps {
  workoutName: string;
  exercises: WorkoutExercise[];
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => Promise<boolean>;
  onCompleteExercise: (exerciseId: string) => Promise<boolean>;
  onReopenExercise: (exerciseId: string) => Promise<boolean>;
  onDeleteExercise: (exerciseId: string) => Promise<boolean>;
  onFinishWorkout: (duration?: number) => Promise<boolean>;
  isActive: boolean;
  onStart: () => void;
}

export function TodayWorkout({
  workoutName,
  exercises,
  onUpdateSet,
  onCompleteExercise,
  onReopenExercise,
  onDeleteExercise,
  onFinishWorkout,
  isActive,
  onStart,
}: TodayWorkoutProps) {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [editingSet, setEditingSet] = useState<{
    set: WorkoutSet;
    exerciseName: string;
  } | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<Date | null>(null);

  // Workout timer
  useEffect(() => {
    if (!isActive) return;
    if (!startTimeRef.current) startTimeRef.current = new Date();

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor(
          (new Date().getTime() - startTimeRef.current.getTime()) / 1000
        );
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Rest timer
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const completedExercises = exercises.filter((e) => e.concluido).length;
  const progress = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  const handleCompleteSet = async (set: WorkoutSet, exercise: WorkoutExercise) => {
    await onUpdateSet(set.id, { concluido: true });
    
    // Start rest timer
    if (set.descanso_seg) {
      setRestTimer(set.descanso_seg);
    }

    // Check if all sets are complete
    const allSetsComplete = exercise.sets.every(
      (s) => s.id === set.id || s.concluido
    );
    if (allSetsComplete) {
      await onCompleteExercise(exercise.id);
    }
  };

  const handleSaveSetParams = async (params: {
    carga: number | null;
    reps: number;
    descanso: number;
    series: number;
  }) => {
    if (!editingSet) return false;
    
    return onUpdateSet(editingSet.set.id, {
      carga: params.carga,
      reps_feitas: params.reps,
      descanso_seg: params.descanso,
    });
  };

  const handleFinish = () => {
    const durationMinutes = Math.ceil(elapsedTime / 60);
    onFinishWorkout(durationMinutes);
  };

  if (!isActive) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{workoutName}</h3>
        <p className="text-muted-foreground mb-4">
          {exercises.length} exercício{exercises.length !== 1 ? "s" : ""} planejados
        </p>
        <Button variant="gradient" size="lg" onClick={onStart}>
          <Play className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with timer */}
      <div className="bg-card rounded-xl border border-primary p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{workoutName}</h3>
            <p className="text-sm text-muted-foreground">
              {completedExercises}/{exercises.length} exercícios
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-xs text-muted-foreground">tempo decorrido</p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Rest timer overlay */}
      {restTimer !== null && restTimer > 0 && (
        <div className="bg-primary text-primary-foreground rounded-xl p-6 text-center animate-pulse">
          <Timer className="w-8 h-8 mx-auto mb-2" />
          <p className="text-4xl font-mono font-bold">{formatTime(restTimer)}</p>
          <p className="text-sm opacity-80 mt-1">Descanso</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => setRestTimer(null)}
          >
            Pular
          </Button>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className={cn(
              "bg-card rounded-xl border overflow-hidden transition-all",
              exercise.concluido
                ? "border-green-500/50 bg-green-500/5"
                : "border-border"
            )}
          >
            <div
              className="flex items-center gap-3 p-4 cursor-pointer"
              onClick={() =>
                setExpandedExercise(
                  expandedExercise === exercise.id ? null : exercise.id
                )
              }
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                  exercise.concluido
                    ? "bg-green-500 text-white"
                    : "bg-primary/10 text-primary"
                )}
              >
                {exercise.concluido ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium truncate",
                    exercise.concluido && "line-through opacity-60"
                  )}
                >
                  {exercise.exercise?.nome || "Exercício"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {exercise.sets.filter((s) => s.concluido).length}/{exercise.sets.length} séries
                </p>
              </div>

              <div className="flex items-center gap-1">
                {exercise.concluido && (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReopenExercise(exercise.id);
                    }}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    title="Reabrir exercício"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteExercise(exercise.id);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Remover exercício"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {expandedExercise === exercise.id ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {expandedExercise === exercise.id && (
              <div className="border-t border-border p-4 space-y-2 bg-muted/30">
                {exercise.sets.map((set) => (
                  <div
                    key={set.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      set.concluido ? "bg-green-500/10" : "bg-background"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {set.num_serie}
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Reps</p>
                        <p className="font-medium">
                          {set.reps_feitas ?? set.reps_alvo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Carga</p>
                        <p className="font-medium">
                          {set.carga ? `${set.carga}kg` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Descanso</p>
                        <p className="font-medium">{set.descanso_seg}s</p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSet({
                            set,
                            exerciseName: exercise.exercise?.nome || "Exercício",
                          });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {!set.concluido && (
                        <Button
                          variant="default"
                          size="iconSm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteSet(set, exercise);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Finish button */}
      {completedExercises === exercises.length && exercises.length > 0 && (
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={handleFinish}
        >
          <Check className="w-5 h-5 mr-2" />
          Finalizar Treino
        </Button>
      )}

      {/* Edit Set Modal */}
      {editingSet && (
        <ExerciseParamsModal
          isOpen={!!editingSet}
          onClose={() => setEditingSet(null)}
          exerciseName={editingSet.exerciseName}
          initialParams={{
            carga: editingSet.set.carga,
            reps: editingSet.set.reps_feitas ?? editingSet.set.reps_alvo,
            descanso: editingSet.set.descanso_seg,
            series: 1,
          }}
          onSave={handleSaveSetParams}
        />
      )}
    </div>
  );
}
