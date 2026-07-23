import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, ArrowRight, Replace, RefreshCw } from "lucide-react";
import type { PlanDay } from "@/hooks/usePlans";

type MigrationMode = "copy" | "move" | "replace";

interface WorkoutMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workouts: PlanDay[];
  allDays: string[];
  daysLabels: Record<string, string>;
  onMigrate: (
    workoutId: string,
    targetDay: string,
    mode: MigrationMode
  ) => Promise<boolean>;
}

export function WorkoutMigrationDialog({
  isOpen,
  onClose,
  workouts,
  allDays,
  daysLabels,
  onMigrate,
}: WorkoutMigrationDialogProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [targetDay, setTargetDay] = useState<string | null>(null);
  const [mode, setMode] = useState<MigrationMode>("move");
  const [isMigrating, setIsMigrating] = useState(false);

  const usedDays = workouts.map((w) => w.dia_semana);
  const availableDays = allDays.filter((d) => !usedDays.includes(d));
  const occupiedDays = allDays.filter((d) => usedDays.includes(d));

  const selectedWorkoutData = workouts.find((w) => w.id === selectedWorkout);

  const handleMigrate = async () => {
    if (!selectedWorkout || !targetDay) return;

    setIsMigrating(true);
    const success = await onMigrate(selectedWorkout, targetDay, mode);
    setIsMigrating(false);

    if (success) {
      setSelectedWorkout(null);
      setTargetDay(null);
      onClose();
    }
  };

  const modeOptions = [
    {
      value: "move" as MigrationMode,
      label: "Mover",
      description: "Move o treino para o novo dia",
      icon: ArrowRight,
    },
    {
      value: "copy" as MigrationMode,
      label: "Copiar",
      description: "Duplica o treino para o novo dia",
      icon: Copy,
    },
    {
      value: "replace" as MigrationMode,
      label: "Substituir",
      description: "Remove o treino existente e coloca este",
      icon: Replace,
      requiresOccupied: true,
    },
  ];

  const filteredModes = modeOptions.filter((m) => {
    if (m.requiresOccupied) {
      return targetDay && usedDays.includes(targetDay);
    }
    return true;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Migrar Treino
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Select workout */}
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Selecione o treino</label>
            <div className="grid grid-cols-2 gap-2">
              {workouts.map((workout) => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedWorkout === workout.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-sm">
                    {workout.nome_treino || "Treino"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {daysLabels[workout.dia_semana]} • {workout.exercises.length} exercícios
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select target day */}
          {selectedWorkout && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-medium">2. Selecione o dia destino</label>
              
              {availableDays.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dias disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDays.map((day) => (
                      <Button
                        key={day}
                        variant={targetDay === day ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTargetDay(day)}
                      >
                        {daysLabels[day]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {occupiedDays.filter((d) => d !== selectedWorkoutData?.dia_semana).length > 0 && (
                <div className="space-y-1 mt-3">
                  <p className="text-xs text-muted-foreground">Dias ocupados (substituir):</p>
                  <div className="flex flex-wrap gap-2">
                    {occupiedDays
                      .filter((d) => d !== selectedWorkoutData?.dia_semana)
                      .map((day) => (
                        <Button
                          key={day}
                          variant={targetDay === day ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            setTargetDay(day);
                            setMode("replace");
                          }}
                        >
                          {daysLabels[day]}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select mode */}
          {selectedWorkout && targetDay && (
            <div className="space-y-2 animate-slide-up">
              <label className="text-sm font-medium">3. Tipo de operação</label>
              <div className="space-y-2">
                {filteredModes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      mode === m.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <m.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedWorkout && targetDay && (
            <div className="bg-muted rounded-lg p-4 animate-slide-up">
              <p className="text-sm">
                <strong>{mode === "copy" ? "Copiar" : mode === "move" ? "Mover" : "Substituir"}</strong>:{" "}
                "{selectedWorkoutData?.nome_treino || "Treino"}" de{" "}
                <strong>{daysLabels[selectedWorkoutData?.dia_semana || ""]}</strong> para{" "}
                <strong>{daysLabels[targetDay]}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={!selectedWorkout || !targetDay || isMigrating}
          >
            {isMigrating ? "Migrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
