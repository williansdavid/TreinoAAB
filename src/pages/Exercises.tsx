import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Image,
  Dumbbell,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useExercises, type Exercise } from "@/hooks/useExercises";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateExerciseModal } from "@/components/planning/CreateExerciseModal";
import { ExerciseViewer } from "@/components/workout/ExerciseViewer";

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { exercises, muscleGroups, isLoading, refetch } = useExercises();

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.nome.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !selectedGroup || e.grupo_muscular === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleDelete = async () => {
    if (!deletingExercise) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", deletingExercise.id);

      if (error) throw error;

      toast.success("Exercício excluído com sucesso!");
      setDeletingExercise(null);
      refetch();
    } catch (err) {
      console.error("Error deleting exercise:", err);
      toast.error("Erro ao excluir exercício");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie sua biblioteca de exercícios
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar exercício..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Muscle group filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        <Button
          variant={selectedGroup === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedGroup(null)}
          className="whitespace-nowrap shrink-0"
        >
          Todos
        </Button>
        {muscleGroups.map((group) => (
          <Button
            key={group}
            variant={selectedGroup === group ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroup(group)}
            className="whitespace-nowrap shrink-0"
          >
            {group}
          </Button>
        ))}
      </div>

      {/* Exercise list */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-2 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="animate-pulse">Carregando exercícios...</div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Dumbbell className="w-12 h-12 opacity-30" />
              <p>Nenhum exercício encontrado</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar exercício
              </Button>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                {/* Thumbnail or placeholder */}
                <button
                  onClick={() => setViewingExercise(exercise)}
                  className="shrink-0 w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                >
                  {exercise.media_url ? (
                    <img
                      src={exercise.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </button>

                {/* Info */}
                <button
                  onClick={() => setViewingExercise(exercise)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-medium text-sm truncate flex items-center gap-1.5">
                    {exercise.nome}
                    {exercise.media_url && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium shrink-0">
                        <Image className="w-2.5 h-2.5" />
                        GIF
                      </span>
                    )}
                    {!exercise.is_system && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        • personalizado
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exercise.grupo_muscular}
                    {exercise.equipamento ? ` • ${exercise.equipamento}` : ""}
                  </p>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setViewingExercise(exercise)}
                    className="text-muted-foreground hover:text-primary"
                    title="Ver detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {!exercise.is_system && (
                    <>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setEditingExercise(exercise)}
                        className="text-muted-foreground hover:text-primary"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setDeletingExercise(exercise)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create/Edit Modal */}
      <CreateExerciseModal
        isOpen={showCreateModal || !!editingExercise}
        onClose={() => {
          setShowCreateModal(false);
          setEditingExercise(null);
        }}
        onSaved={() => {
          refetch();
          setShowCreateModal(false);
          setEditingExercise(null);
        }}
        editingExercise={editingExercise}
      />

      {/* Exercise Viewer */}
      {viewingExercise && (
        <ExerciseViewer
          exerciseId={viewingExercise.id}
          exerciseName={viewingExercise.nome}
          onClose={() => {
            setViewingExercise(null);
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingExercise}
        onOpenChange={() => setDeletingExercise(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Excluir exercício
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingExercise?.nome}</strong>?
              Esta ação não pode ser desfeita.
              {deletingExercise?.media_url && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  A mídia associada (GIF/imagem) também será removida.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}