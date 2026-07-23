import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Save, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseParams {
  carga: number | null;
  reps: number;
  repsMax?: number | null;
  descanso: number;
  series: number;
  observacoes?: string;
}

interface ExerciseParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  initialParams: ExerciseParams;
  onSave: (params: ExerciseParams) => Promise<boolean>;
  lastLoad?: number | null;
}

const QUICK_LOAD_ADJUSTMENTS = [-5, -2.5, -1, 1, 2.5, 5];
const REST_OPTIONS = [30, 45, 60, 90, 120, 180];

export function ExerciseParamsModal({
  isOpen,
  onClose,
  exerciseName,
  initialParams,
  onSave,
  lastLoad,
}: ExerciseParamsModalProps) {
  const [params, setParams] = useState<ExerciseParams>(initialParams);
  const [isRepsRange, setIsRepsRange] = useState(!!initialParams.repsMax);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setParams(initialParams);
    setIsRepsRange(!!initialParams.repsMax);
  }, [initialParams, isOpen]);

  const adjustLoad = (delta: number) => {
    const currentLoad = params.carga || 0;
    const newLoad = Math.max(0, currentLoad + delta);
    setParams((prev) => ({ ...prev, carga: newLoad }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave({
      ...params,
      repsMax: isRepsRange ? params.repsMax : null,
    });
    setIsSaving(false);
    if (success) onClose();
  };

  const useLastLoad = () => {
    if (lastLoad !== null && lastLoad !== undefined) {
      setParams((prev) => ({ ...prev, carga: lastLoad }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Carga */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Carga (kg)</Label>
              {lastLoad !== null && lastLoad !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={useLastLoad}
                  className="text-xs text-primary"
                >
                  Usar última ({lastLoad}kg)
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <Input
                type="number"
                value={params.carga ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    carga: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="text-center text-2xl font-bold h-16 w-32"
                placeholder="0"
                min={0}
                step={0.5}
              />
              <span className="text-lg text-muted-foreground">kg</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_LOAD_ADJUSTMENTS.map((delta) => (
                <Button
                  key={delta}
                  variant="outline"
                  size="sm"
                  onClick={() => adjustLoad(delta)}
                  className={cn(
                    "min-w-[50px]",
                    delta > 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </Button>
              ))}
            </div>
          </div>

          {/* Séries */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Séries</Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    series: Math.max(1, prev.series - 1),
                  }))
                }
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-3xl font-bold w-12 text-center">
                {params.series}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    series: prev.series + 1,
                  }))
                }
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Repetições */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Repetições</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRepsRange(!isRepsRange)}
                className="text-xs"
              >
                {isRepsRange ? "Fixo" : "Intervalo"}
              </Button>
            </div>

            {isRepsRange ? (
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setParams((prev) => ({
                        ...prev,
                        reps: Math.max(1, prev.reps - 1),
                      }))
                    }
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold w-10 text-center">
                    {params.reps}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setParams((prev) => ({
                        ...prev,
                        reps: prev.reps + 1,
                      }))
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-xl">—</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setParams((prev) => ({
                        ...prev,
                        repsMax: Math.max(prev.reps, (prev.repsMax || prev.reps) - 1),
                      }))
                    }
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold w-10 text-center">
                    {params.repsMax || params.reps}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setParams((prev) => ({
                        ...prev,
                        repsMax: (prev.repsMax || prev.reps) + 1,
                      }))
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setParams((prev) => ({
                      ...prev,
                      reps: Math.max(1, prev.reps - 1),
                    }))
                  }
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-3xl font-bold w-12 text-center">
                  {params.reps}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setParams((prev) => ({
                      ...prev,
                      reps: prev.reps + 1,
                    }))
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Descanso */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Descanso</Label>
            <div className="flex flex-wrap justify-center gap-2">
              {REST_OPTIONS.map((seconds) => {
                const label =
                  seconds >= 60
                    ? `${seconds / 60}min`
                    : `${seconds}s`;
                return (
                  <Button
                    key={seconds}
                    variant={params.descanso === seconds ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setParams((prev) => ({ ...prev, descanso: seconds }))
                    }
                    className="min-w-[50px]"
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Observações</Label>
            <Input
              value={params.observacoes || ""}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, observacoes: e.target.value }))
              }
              placeholder="Notas adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
