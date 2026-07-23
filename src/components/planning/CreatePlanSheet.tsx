import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const DIAS_SEMANA = [
  { id: "segunda", label: "Segunda" },
  { id: "terca", label: "Terça" },
  { id: "quarta", label: "Quarta" },
  { id: "quinta", label: "Quinta" },
  { id: "sexta", label: "Sexta" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

interface CreatePlanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
  createPlan: (
    nome: string,
    diasSemana: number,
    tempoPorDia: number,
    days: { 
      dia: string; 
      nome_treino: string;
      exercicios?: { nome: string; series: number; reps: number; descanso_seg: number }[];
    }[]
  ) => Promise<any>;
}

export function CreatePlanSheet({
  isOpen,
  onClose,
  onPlanCreated,
  createPlan,
}: CreatePlanSheetProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "manual" | "ai">("choose");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual mode state
  const [planName, setPlanName] = useState("");
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({});
  const [dayNames, setDayNames] = useState<Record<string, string>>({});
  const [tempoPorDia, setTempoPorDia] = useState(60);

  const resetState = () => {
    setMode("choose");
    setPlanName("");
    setSelectedDays({});
    setDayNames({});
    setTempoPorDia(60);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const toggleDay = (dia: string) => {
    setSelectedDays((prev) => ({
      ...prev,
      [dia]: !prev[dia],
    }));
  };

  const handleDayNameChange = (dia: string, nome: string) => {
    setDayNames((prev) => ({
      ...prev,
      [dia]: nome,
    }));
  };

  const handleCreateManual = async () => {
    const diasSelecionados = Object.entries(selectedDays)
      .filter(([_, selected]) => selected)
      .map(([dia]) => dia);

    if (diasSelecionados.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos um dia",
        description: "Escolha os dias da semana para treinar.",
      });
      return;
    }

    const days = diasSelecionados.map((dia) => ({
      dia,
      nome_treino: dayNames[dia] || `Treino de ${DIAS_SEMANA.find((d) => d.id === dia)?.label}`,
    }));

    const result = await createPlan(
      planName || "Meu Plano de Treino",
      diasSelecionados.length,
      tempoPorDia,
      days
    );

    if (result) {
      onPlanCreated();
      handleClose();
    }
  };

  const handleGenerateAI = async () => {
    if (!profile) {
      toast({
        variant: "destructive",
        title: "Perfil incompleto",
        description: "Complete o onboarding antes de gerar um plano com IA.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          type: "generate_plan",
          data: {
            objetivo: profile.objetivo || "hipertrofia",
            experiencia: profile.experiencia || "iniciante",
            dias_semana: profile.dias_semana || 3,
            tempo_por_dia_min: profile.tempo_por_dia_min || 60,
            equipamentos: profile.equipamentos || [],
            limitacoes: profile.limitacoes || [],
          },
        },
      });

      if (error) throw error;

      if (data.plan) {
        // Normalize day names from AI response to our internal format
        const diasMap: Record<string, string> = {
          "segunda-feira": "segunda",
          "segunda": "segunda",
          "terca-feira": "terca",
          "terça-feira": "terca",
          "terça": "terca",
          "terca": "terca",
          "quarta-feira": "quarta",
          "quarta": "quarta",
          "quinta-feira": "quinta",
          "quinta": "quinta",
          "sexta-feira": "sexta",
          "sexta": "sexta",
          "sabado": "sabado",
          "sábado": "sabado",
          "domingo": "domingo",
        };

        const days = data.plan.dias.map((d: any, index: number) => {
          // Normalize the day name - remove accents and convert to lowercase
          const diaLower = d.dia
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          const diaNormalizado = diasMap[diaLower] || DIAS_SEMANA[index % 7].id;
          
          console.log("Day mapping:", d.dia, "->", diaLower, "->", diaNormalizado);
          
          return {
            dia: diaNormalizado,
            nome_treino: d.nome_treino,
            exercicios: d.exercicios?.map((ex: any) => ({
              nome: ex.nome,
              series: ex.series || 3,
              reps: ex.reps || 12,
              descanso_seg: ex.descanso_seg || 60,
            })) || [],
          };
        });

        const result = await createPlan(
          data.plan.nome_plano || "Plano Gerado com IA",
          days.length,
          profile.tempo_por_dia_min || 60,
          days
        );

        if (result) {
          toast({
            title: "Plano criado com sucesso! 🎉",
            description: "Agora adicione exercícios a cada dia.",
          });
          onPlanCreated();
          handleClose();
        }
      } else {
        toast({
          title: "Sugestão gerada",
          description: data.content?.slice(0, 100) + "...",
        });
      }
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = Object.values(selectedDays).filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {mode === "choose" && "Criar novo plano"}
            {mode === "manual" && "Criar plano manualmente"}
            {mode === "ai" && "Gerar plano com IA"}
          </SheetTitle>
          <SheetDescription>
            {mode === "choose" && "Escolha como você quer criar seu plano de treino."}
            {mode === "manual" && "Selecione os dias e nomeie cada treino."}
            {mode === "ai" && "A IA vai criar um plano baseado no seu perfil."}
          </SheetDescription>
        </SheetHeader>

        {mode === "choose" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("ai")}
              className="w-full p-6 rounded-xl border border-primary/30 bg-primary/5 text-left hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Gerar com IA</h3>
                  <p className="text-sm text-muted-foreground">
                    A IA cria um plano personalizado baseado nos seus objetivos,
                    experiência e tempo disponível.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="w-full p-6 rounded-xl border border-border bg-card text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Criar manualmente</h3>
                  <p className="text-sm text-muted-foreground">
                    Escolha os dias da semana e monte seu plano do zero,
                    adicionando exercícios depois.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-6">
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <h4 className="font-medium">Seu perfil</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Objetivo:</span>{" "}
                  {profile?.objetivo || "Não definido"}
                </div>
                <div>
                  <span className="text-muted-foreground">Experiência:</span>{" "}
                  {profile?.experiencia || "Não definido"}
                </div>
                <div>
                  <span className="text-muted-foreground">Dias/semana:</span>{" "}
                  {profile?.dias_semana || 3}
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo/dia:</span>{" "}
                  {profile?.tempo_por_dia_min || 60}min
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              A IA vai criar um plano com {profile?.dias_semana || 3} dias de treino 
              por semana, cada sessão com aproximadamente {profile?.tempo_por_dia_min || 60} minutos.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                Voltar
              </Button>
              <Button
                variant="gradient"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Plano
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="planName">Nome do plano</Label>
              <Input
                id="planName"
                placeholder="Ex: Treino de Hipertrofia"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo por treino (minutos)</Label>
              <Input
                id="tempo"
                type="number"
                min={15}
                max={180}
                value={tempoPorDia}
                onChange={(e) => setTempoPorDia(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3">
              <Label>Dias de treino ({selectedCount} selecionados)</Label>
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={dia.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    selectedDays[dia.id]
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      id={dia.id}
                      checked={selectedDays[dia.id] || false}
                      onCheckedChange={() => toggleDay(dia.id)}
                    />
                    <label
                      htmlFor={dia.id}
                      className="font-medium cursor-pointer flex-1"
                    >
                      {dia.label}
                    </label>
                  </div>
                  {selectedDays[dia.id] && (
                    <Input
                      placeholder={`Nome do treino (ex: Peito e Tríceps)`}
                      value={dayNames[dia.id] || ""}
                      onChange={(e) => handleDayNameChange(dia.id, e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setMode("choose")} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleCreateManual}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                Criar Plano
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
