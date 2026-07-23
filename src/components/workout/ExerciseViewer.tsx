import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Loader2,
  AlertTriangle,
  Dumbbell,
  RefreshCw,
  Play,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Check,
  Sparkles,
  Upload,
  Pencil,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { CreateExerciseModal } from "@/components/planning/CreateExerciseModal";
import type { Exercise } from "@/hooks/useExercises";

interface ExerciseViewerProps {
  exerciseId: string | null;
  exerciseName: string;
  onClose: () => void;
}

export function ExerciseViewer({
  exerciseId,
  exerciseName,
  onClose,
}: ExerciseViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

  // Full exercise data for editing
  const [exerciseData, setExerciseData] = useState<Exercise | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Media URL state
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  // AI Video/Image generation state
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [visualDescription, setVisualDescription] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("visual");

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch exercise data from database
  const fetchExerciseData = async () => {
    if (!exerciseId) return;
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", exerciseId)
        .single();

      if (error) throw error;
      if (data) {
        setExerciseData(data as unknown as Exercise);
        if (data.media_url) {
          setMediaUrl(data.media_url);
          setNewMediaUrl(data.media_url);
        }
      }
    } catch (err) {
      console.error("Error fetching exercise:", err);
    }
  };

  const saveMediaUrl = async () => {
    if (!exerciseId) return;
    setIsSavingUrl(true);
    try {
      const { error } = await supabase
        .from("exercises")
        .update({ media_url: newMediaUrl || null })
        .eq("id", exerciseId);

      if (error) throw error;
      setMediaUrl(newMediaUrl || null);
      setIsEditingUrl(false);
      toast.success("URL da mídia salva com sucesso!");
    } catch (err: any) {
      console.error("Error saving media URL:", err);
      toast.error("Erro ao salvar URL da mídia");
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !exerciseId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem ou GIF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${exerciseId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("exercise-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("exercise-media")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("exercises")
        .update({ media_url: publicUrl })
        .eq("id", exerciseId);

      if (updateError) throw updateError;

      setMediaUrl(publicUrl);
      setNewMediaUrl(publicUrl);
      toast.success("GIF salvo com sucesso!");
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchGuidance = async () => {
    if (!exerciseName) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-coach", {
        body: {
          type: "exercise_guidance",
          data: {
            exercise_name: exerciseName,
            equipamentos: profile?.equipamentos || [],
            limitacoes: profile?.limitacoes || [],
          },
        },
      });

      if (fnError) throw fnError;
      if (data.error) {
        setError(data.error);
      } else {
        setContent(data.content);
      }
    } catch (err: any) {
      console.error("Error fetching guidance:", err);
      setError("Não foi possível carregar as instruções. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateVisual = async () => {
    if (!exerciseName) return;
    setIsGeneratingVisual(true);
    setVisualError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-exercise-video",
        {
          body: {
            exerciseName: exerciseName,
            muscleGroup: null,
            equipment: null,
          },
        }
      );

      if (fnError) throw fnError;
      if (data.error) {
        setVisualError(data.error);
        toast.error(data.error);
      } else {
        setVisualUrl(data.imageUrl);
        setVisualDescription(data.description);
        toast.success("Visualização gerada com sucesso!");
      }
    } catch (err: any) {
      console.error("Error generating visual:", err);
      setVisualError("Não foi possível gerar a visualização. Tente novamente.");
      toast.error("Erro ao gerar visualização");
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleEditSaved = () => {
    setShowEditModal(false);
    fetchExerciseData(); // Recarrega dados após edição
    toast.success("Exercício atualizado!");
  };

  useEffect(() => {
    if (exerciseId && exerciseName) {
      fetchExerciseData();
      fetchGuidance();
      setVisualUrl(null);
      setVisualDescription(null);
      setVisualError(null);
      setIsEditingUrl(false);
      setActiveTab("visual");
    }
  }, [exerciseId, exerciseName]);

  return (
    <Dialog open={!!exerciseId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              {exerciseName}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Visualização
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Instruções
            </TabsTrigger>
          </TabsList>

          {/* Visual Tab */}
          <TabsContent value="visual" className="flex-1">
            <div className="space-y-4 py-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              {/* Saved media URL display */}
              {mediaUrl && !isEditingUrl && (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={mediaUrl}
                      alt={exerciseName}
                      className="w-full max-h-[300px] object-contain bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1" />
                      )}
                      {isUploading ? "Enviando..." : "Trocar arquivo"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUrl(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Editar URL
                    </Button>
                  </div>
                </div>
              )}

              {/* Edit URL form */}
              {isEditingUrl && (
                <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://exemplo.com/exercicio.gif"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a URL de um GIF ou imagem que demonstre a execução do
                    exercício
                  </p>

                  {newMediaUrl && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={newMediaUrl}
                        alt="Preview"
                        className="w-full max-h-[200px] object-contain bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingUrl(false);
                        setNewMediaUrl(mediaUrl || "");
                      }}
                      disabled={isSavingUrl}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveMediaUrl}
                      disabled={isSavingUrl}
                    >
                      {isSavingUrl ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {/* No media URL - show options */}
              {!mediaUrl && !isEditingUrl && (
                <div className="space-y-3">
                  {/* Upload file option */}
                  <div className="p-4 rounded-lg border-2 border-dashed border-border text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-medium text-sm">Enviar GIF/Imagem</p>
                    <p className="text-xs text-muted-foreground">
                      Faça upload de um arquivo do seu dispositivo
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1" />
                      )}
                      {isUploading ? "Enviando..." : "Escolher arquivo"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Add URL option */}
                  <div className="p-4 rounded-lg border-2 border-dashed border-border text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <LinkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-medium text-sm">Colar URL</p>
                    <p className="text-xs text-muted-foreground">
                      Cole a URL de um GIF demonstrativo
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUrl(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Adicionar URL
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Generate with AI option */}
                  {!visualUrl && !isGeneratingVisual && !visualError && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-border text-center space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm">Gerar com IA</p>
                      <p className="text-xs text-muted-foreground">
                        A IA vai criar uma ilustração da execução correta
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateVisual}
                        disabled={isGeneratingVisual}
                      >
                        {isGeneratingVisual ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-1" />
                        )}
                        Gerar visualização
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Generation states */}
              {isGeneratingVisual && (
                <div className="p-6 rounded-lg bg-muted/30 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="font-medium text-sm">Gerando visualização com IA...</p>
                  <p className="text-xs text-muted-foreground">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              )}

              {visualError && (
                <div className="p-4 rounded-lg bg-destructive/10 text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 mx-auto text-destructive" />
                  <p className="text-sm text-destructive">{visualError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateVisual}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Tentar novamente
                  </Button>
                </div>
              )}

              {visualUrl && !isGeneratingVisual && !mediaUrl && (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={visualUrl}
                      alt={exerciseName}
                      className="w-full max-h-[300px] object-contain bg-muted"
                    />
                  </div>
                  {visualDescription && (
                    <p className="text-xs text-muted-foreground italic">
                      {visualDescription}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateVisual}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Gerar nova
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUrl(true)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Adicionar URL
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Instructions Tab */}
          <TabsContent value="instructions" className="flex-1">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando instruções com IA...</span>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 mx-auto text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchGuidance}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Tentar novamente
                  </Button>
                </div>
              )}

              {content && !isLoading && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Safety disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            As orientações são informativas e não substituem acompanhamento
            profissional.
          </p>
        </div>
      </DialogContent>

      {/* Edit Exercise Modal */}
      {showEditModal && exerciseData && (
        <CreateExerciseModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
          editingExercise={exerciseData}
        />
      )}
    </Dialog>
  );
}