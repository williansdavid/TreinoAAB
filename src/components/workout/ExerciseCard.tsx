import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  Check,
  Timer,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RestTimer } from "./RestTimer"
import type { WorkoutExercise, WorkoutSet } from "@/hooks/useWorkouts"

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise
  onUpdateSet: (setId: string, updates: Partial<WorkoutSet>) => Promise<boolean>
  onCompleteExercise: (exerciseId: string) => Promise<boolean>
  onReopenExercise?: (exerciseId: string) => Promise<boolean>
  onDeleteExercise?: (exerciseId: string) => Promise<boolean>
  onViewExercise: (exerciseId: string) => void
}

export function ExerciseCard({
  workoutExercise,
  onUpdateSet,
  onCompleteExercise,
  onReopenExercise,
  onDeleteExercise,
  onViewExercise,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [restTimer, setRestTimer] = useState<{
    active: boolean
    setId: string | null
  }>({ active: false, setId: null })

  const exercise = workoutExercise.exercise
  const completedSets = workoutExercise.sets.filter((s) => s.concluido).length
  const totalSets = workoutExercise.sets.length
  const allSetsCompleted = completedSets === totalSets

  const handleCompleteSet = (set: WorkoutSet) => {
    onUpdateSet(set.id, { concluido: true })
    setRestTimer({ active: true, setId: set.id })
  }

  const handleRestComplete = () => {
    setRestTimer({ active: false, setId: null })
  }

  const handleRestSkip = () => {
    setRestTimer({ active: false, setId: null })
  }

  const adjustValue = (
    setId: string,
    field: "reps_feitas" | "carga",
    delta: number,
    currentValue: number | null
  ) => {
    const newValue = Math.max(0, (currentValue || 0) + delta)
    onUpdateSet(setId, { [field]: newValue })
  }

  if (!exercise) return null

  return (
    <div
      className={cn(
        "bg-card rounded-xl border-2 overflow-hidden transition-all",
        workoutExercise.concluido ? "border-success/50" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1"
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              workoutExercise.concluido ? "bg-success/20" : "bg-primary/10"
            )}
          >
            {workoutExercise.concluido ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <span className="text-lg">🏋️</span>
            )}
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{exercise.nome}</h3>
            <p className="text-sm text-muted-foreground">
              {exercise.grupo_muscular} &bull; {completedSets}/{totalSets} séries
              {workoutExercise.concluido && " ✓"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {workoutExercise.concluido && onReopenExercise && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => onReopenExercise(workoutExercise.id)}
              className="text-primary hover:text-primary hover:bg-primary/10"
              title="Reabrir exercício"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          {onDeleteExercise && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => onDeleteExercise(workoutExercise.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Remover exercício"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Exercise GIF/Image */}
          {exercise.media_url ? (
            <div className="rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={exercise.media_url}
                alt={`Execução: ${exercise.nome}`}
                className="w-full h-auto max-h-64 object-contain cursor-pointer"
                onClick={() => onViewExercise(exercise.id)}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          ) : null}

          {/* View exercise button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewExercise(exercise.id)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            {exercise.media_url ? "Ver detalhes" : "Adicionar visualização"}
          </Button>

          {/* Timer de descanso */}
          {restTimer.active && restTimer.setId && (
            <RestTimer
              key={restTimer.setId}
              seconds={
                workoutExercise.sets.find((s) => s.id === restTimer.setId)
                  ?.descanso_seg || 60
              }
              exerciseName={exercise.nome}
              serieNumber={completedSets}
              onComplete={handleRestComplete}
              onSkip={handleRestSkip}
            />
          )}

          {/* Sets */}
          <div className="space-y-3">
            {workoutExercise.sets.map((set) => {
              const isCompleted = set.concluido
              const isResting = restTimer.active && restTimer.setId === set.id

              return (
                <div
                  key={set.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isCompleted
                      ? "bg-success/10 border-success/30"
                      : "bg-muted/50 border-border",
                    isResting && "ring-2 ring-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">
                      Série {set.num_serie}
                      {isCompleted && (
                        <span className="ml-2 text-xs text-green-500">✓</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {!isResting && !isCompleted && (
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() =>
                            setRestTimer({
                              active: true,
                              setId: set.id,
                            })
                          }
                          disabled={isCompleted}
                          title="Iniciar descanso manual"
                        >
                          <Timer className="w-4 h-4" />
                        </Button>
                      )}
                      {!isCompleted ? (
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleCompleteSet(set)}
                        />
                      ) : (
                        <span className="text-green-500">
                          <Check className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Reps */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Reps (alvo: {set.reps_alvo})
                      </label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() =>
                            adjustValue(set.id, "reps_feitas", -1, set.reps_feitas)
                          }
                          disabled={isCompleted}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={set.reps_feitas ?? ""}
                          onChange={(e) =>
                            onUpdateSet(set.id, {
                              reps_feitas: parseInt(e.target.value) || 0,
                            })
                          }
                          className="text-center h-9"
                          placeholder={set.reps_alvo.toString()}
                          disabled={isCompleted}
                        />
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() =>
                            adjustValue(set.id, "reps_feitas", 1, set.reps_feitas)
                          }
                          disabled={isCompleted}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Carga */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Carga (kg)
                      </label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() =>
                            adjustValue(set.id, "carga", -2.5, set.carga)
                          }
                          disabled={isCompleted}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          step="0.5"
                          value={set.carga ?? ""}
                          onChange={(e) =>
                            onUpdateSet(set.id, {
                              carga: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="text-center h-9"
                          placeholder="0"
                          disabled={isCompleted}
                        />
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() =>
                            adjustValue(set.id, "carga", 2.5, set.carga)
                          }
                          disabled={isCompleted}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Complete exercise button */}
          {!workoutExercise.concluido && allSetsCompleted && (
            <Button
              variant="success"
              size="lg"
              onClick={() => onCompleteExercise(workoutExercise.id)}
              className="w-full"
            >
              <Check className="w-5 h-5 mr-2" />
              Concluir exercício
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
