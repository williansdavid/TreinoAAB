import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check, Pencil } from "lucide-react";
import { useExercises, type Exercise } from "@/hooks/useExercises";
import { cn } from "@/lib/utils";
import { CreateExerciseModal } from "@/components/planning/CreateExerciseModal";

interface AddExerciseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string) => Promise<boolean>;
}

export function AddExerciseSheet({ isOpen, onClose, onAdd }: AddExerciseSheetProps) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const { exercises, muscleGroups, isLoading, refetch } = useExercises();

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.nome.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !selectedGroup || e.grupo_muscular === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleAdd = async (exerciseId: string) => {
    setAddingId(exerciseId);
    const success = await onAdd(exerciseId);
    if (success) {
      onClose();
    }
    setAddingId(null);
  };

  const handleEditExercise = (e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation();
    setEditingExercise(exercise);
  };

  const handleExerciseSaved = () => {
    refetch();
    setEditingExercise(null);
    setShowCreateExercise(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>Adicionar exercício</SheetTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateExercise(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar novo
              </Button>
            </div>
          </SheetHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Muscle group filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            <Button
              variant={selectedGroup === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroup(null)}
            >
              Todos
            </Button>
            {muscleGroups.map((group) => (
              <Button
                key={group}
                variant={selectedGroup === group ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGroup(group)}
                className="whitespace-nowrap"
              >
                {group}
              </Button>
            ))}
          </div>

          {/* Exercise list */}
          <ScrollArea className="h-[calc(100%-160px)]">
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all",
                    addingId === exercise.id && "opacity-50"
                  )}
                >
                  <button
                    onClick={() => handleAdd(exercise.id)}
                    disabled={addingId === exercise.id}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium">{exercise.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.grupo_muscular} • {exercise.equipamento || "Peso corporal"}
                    </p>
                    {exercise.instrucoes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {exercise.instrucoes}
                      </p>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {!exercise.is_system && (
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => handleEditExercise(e, exercise)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <button
                      onClick={() => handleAdd(exercise.id)}
                      disabled={addingId === exercise.id}
                      className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                      {addingId === exercise.id ? (
                        <Check className="w-5 h-5 text-primary animate-pulse" />
                      ) : (
                        <Plus className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {filteredExercises.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">Nenhum exercício encontrado</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateExercise(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Criar exercício personalizado
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Exercise Modal */}
      <CreateExerciseModal
        isOpen={showCreateExercise || !!editingExercise}
        onClose={() => {
          setShowCreateExercise(false);
          setEditingExercise(null);
        }}
        onSaved={handleExerciseSaved}
        editingExercise={editingExercise}
      />
    </>
  );
}
