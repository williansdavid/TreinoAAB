import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Edit,
  Plus,
  ChevronRight,
} from "lucide-react";
import { ExerciseParamsModal } from "./ExerciseParamsModal";
import type { PlanDay, PlanExercise } from "@/hooks/usePlans";

interface DayExercisesListProps {
  day: PlanDay;
  daysLabels: Record<string, string>;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseId: string) => Promise<boolean>;
  onUpdateExercise: (
    exerciseId: string,
    params: {
      series: number;
      reps: number;
      descanso: number;
      carga?: number | null;
      observacoes?: string;
    }
  ) => Promise<boolean>;
}

export function DayExercisesList({
  day,
  daysLabels,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
}: DayExercisesListProps) {
  const [editingExercise, setEditingExercise] = useState<PlanExercise | null>(null);

  const handleSaveParams = async (params: {
    carga: number | null;
    reps: number;
    repsMax?: number | null;
    descanso: number;
    series: number;
    observacoes?: string;
  }) => {
    if (!editingExercise) return false;

    return onUpdateExercise(editingExercise.id, {
      series: params.series,
      reps: params.reps,
      descanso: params.descanso,
      carga: params.carga,
      observacoes: params.observacoes,
    });
  };

  return (
    <div className="bg-card rounded-xl border border-primary p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {daysLabels[day.dia_semana]}
          </p>
          <h3 className="text-lg font-semibold">{day.nome_treino || "Treino"}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onAddExercise}>
          <Plus className="w-4 h-4 mr-1" />
          Exercício
        </Button>
      </div>

      {day.exercises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">Nenhum exercício adicionado</p>
          <Button variant="ghost" size="sm" onClick={onAddExercise}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar primeiro exercício
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {day.exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setEditingExercise(exercise)}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {exercise.exercise?.nome || "Exercício"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {exercise.series_padrao}x{exercise.reps_padrao}
                  {exercise.carga_padrao ? ` • ${exercise.carga_padrao}kg` : ""}
                  {" • "}
                  {exercise.descanso_padrao_seg >= 60
                    ? `${exercise.descanso_padrao_seg / 60}min`
                    : `${exercise.descanso_padrao_seg}s`}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingExercise(exercise);
                  }}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveExercise(exercise.id);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingExercise && (
        <ExerciseParamsModal
          isOpen={!!editingExercise}
          onClose={() => setEditingExercise(null)}
          exerciseName={editingExercise.exercise?.nome || "Exercício"}
          initialParams={{
            carga: editingExercise.carga_padrao,
            reps: editingExercise.reps_padrao,
            descanso: editingExercise.descanso_padrao_seg,
            series: editingExercise.series_padrao,
            observacoes: editingExercise.observacoes || "",
          }}
          onSave={handleSaveParams}
        />
      )}
    </div>
  );
}
