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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Dumbbell, Pencil, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Exercise } from "@/hooks/useExercises";

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Posterior",
  "Glúteos",
  "Panturrilha",
  "Abdômen",
  "Core",
  "Antebraço",
  "Cardio",
  "Mobilidade",
];

const EQUIPMENT_OPTIONS = [
  "Peso Corporal",
  "Barra",
  "Halteres",
  "Máquina",
  "Cabo",
  "Kettlebell",
  "Elástico",
  "Banco",
  "TRX",
  "Bola",
  "Outro",
];

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingExercise?: Exercise | null;
}

export function CreateExerciseModal({
  isOpen,
  onClose,
  onSaved,
  editingExercise,
}: CreateExerciseModalProps) {
  const [nome, setNome] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [instrucoes, setInstrucoes] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editingExercise;

  useEffect(() => {
    if (isOpen && editingExercise) {
      setNome(editingExercise.nome);
      setGrupoMuscular(editingExercise.grupo_muscular);
      setEquipamento(editingExercise.equipamento || "");
      setInstrucoes(editingExercise.instrucoes || "");
      setMediaUrl(editingExercise.media_url || "");
    } else if (isOpen) {
      setNome("");
      setGrupoMuscular("");
      setEquipamento("");
      setInstrucoes("");
      setMediaUrl("");
    }
  }, [isOpen, editingExercise]);

  const handleSave = async () => {
    if (!nome.trim() || !grupoMuscular) {
      toast.error("Nome e grupo muscular são obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Usuário não autenticado");
        return;
      }

      if (isEditing && editingExercise) {
        const { error } = await supabase
          .from("exercises")
          .update({
            nome: nome.trim(),
            grupo_muscular: grupoMuscular,
            equipamento: equipamento || null,
            instrucoes: instrucoes.trim() || null,
            media_url: mediaUrl.trim() || null,
          })
          .eq("id", editingExercise.id);

        if (error) throw error;
        toast.success("Exercício atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("exercises").insert({
          nome: nome.trim(),
          grupo_muscular: grupoMuscular,
          equipamento: equipamento || null,
          instrucoes: instrucoes.trim() || null,
          media_url: mediaUrl.trim() || null,
          created_by: userData.user.id,
          is_system: false,
        });

        if (error) throw error;
        toast.success("Exercício criado com sucesso!");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("Erro ao salvar exercício");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 text-primary" />
                Editar Exercício
              </>
            ) : (
              <>
                <Dumbbell className="w-5 h-5 text-primary" />
                Novo Exercício
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do exercício *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Supino Inclinado com Halteres"
            />
          </div>

          {/* Grupo Muscular */}
          <div className="space-y-2">
            <Label>Grupo muscular *</Label>
            <Select value={grupoMuscular} onValueChange={setGrupoMuscular}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo muscular" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipamento */}
          <div className="space-y-2">
            <Label>Equipamento</Label>
            <Select value={equipamento} onValueChange={setEquipamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <SelectItem key={eq} value={eq}>
                    {eq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instruções */}
          <div className="space-y-2">
            <Label htmlFor="instrucoes">Instruções / Descrição</Label>
            <Textarea
              id="instrucoes"
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              placeholder="Descreva como executar o exercício, dicas de postura, observações..."
              className="min-h-[100px]"
            />
          </div>

          {/* Media URL */}
          <div className="space-y-2">
            <Label htmlFor="mediaUrl">URL do GIF demonstrativo</Label>
            <div className="flex gap-2">
              <Input
                id="mediaUrl"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://exemplo.com/exercicio.gif"
                className="flex-1"
              />
              {mediaUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMediaUrl("")}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border">
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full max-h-[200px] object-contain bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Cole a URL de um GIF ou imagem que demonstre a execução do exercício
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}