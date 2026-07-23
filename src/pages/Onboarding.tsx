import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Dumbbell, 
  Target, 
  Clock, 
  Calendar, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const OBJETIVOS = [
  { id: "hipertrofia", label: "Ganhar massa muscular", icon: "💪" },
  { id: "forca", label: "Aumentar força", icon: "🏋️" },
  { id: "emagrecimento", label: "Perder gordura", icon: "🔥" },
  { id: "condicionamento", label: "Melhorar condicionamento", icon: "❤️" },
  { id: "saude", label: "Manter a saúde", icon: "🌟" },
];

const EXPERIENCIAS = [
  { id: "iniciante", label: "Iniciante", desc: "Menos de 6 meses treinando" },
  { id: "intermediario", label: "Intermediário", desc: "6 meses a 2 anos" },
  { id: "avancado", label: "Avançado", desc: "Mais de 2 anos" },
];

const EQUIPAMENTOS = [
  { id: "barra", label: "Barra e anilhas" },
  { id: "halteres", label: "Halteres" },
  { id: "maquinas", label: "Máquinas" },
  { id: "cabos", label: "Cabos/Polia" },
  { id: "peso_corporal", label: "Peso corporal" },
  { id: "elasticos", label: "Elásticos" },
  { id: "kettlebell", label: "Kettlebell" },
];

const LIMITACOES = [
  { id: "ombro", label: "Dor/lesão no ombro" },
  { id: "joelho", label: "Dor/lesão no joelho" },
  { id: "lombar", label: "Dor lombar" },
  { id: "punho", label: "Dor/lesão no punho" },
  { id: "cotovelo", label: "Dor/lesão no cotovelo" },
  { id: "nenhuma", label: "Nenhuma limitação" },
];

interface OnboardingData {
  nome: string;
  objetivo: string;
  experiencia: string;
  equipamentos: string[];
  limitacoes: string[];
  dias_semana: number;
  tempo_por_dia_min: number;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    nome: "",
    objetivo: "",
    experiencia: "",
    equipamentos: [],
    limitacoes: [],
    dias_semana: 3,
    tempo_por_dia_min: 60,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 5;

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "equipamentos" | "limitacoes", item: string) => {
    setData((prev) => {
      const arr = prev[field];
      if (item === "nenhuma" && field === "limitacoes") {
        return { ...prev, [field]: arr.includes(item) ? [] : [item] };
      }
      if (arr.includes("nenhuma") && field === "limitacoes") {
        return { ...prev, [field]: [item] };
      }
      return {
        ...prev,
        [field]: arr.includes(item)
          ? arr.filter((i) => i !== item)
          : [...arr, item],
      };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.nome.trim().length >= 2;
      case 2:
        return data.objetivo !== "" && data.experiencia !== "";
      case 3:
        return data.equipamentos.length > 0;
      case 4:
        return data.limitacoes.length > 0;
      case 5:
        return data.dias_semana >= 1 && data.tempo_por_dia_min >= 15;
      default:
        return false;
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const profileData = {
        user_id: user.id,
        nome: data.nome.trim(),
        objetivo: data.objetivo,
        experiencia: data.experiencia as "iniciante" | "intermediario" | "avancado",
        equipamentos: data.equipamentos,
        limitacoes: data.limitacoes.filter((l) => l !== "nenhuma"),
        dias_semana: data.dias_semana,
        tempo_por_dia_min: data.tempo_por_dia_min,
        onboarding_completed: true,
      };

      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { 
          onConflict: "user_id",
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Perfil configurado! 🎉",
        description: "Agora vamos criar seu plano de treino.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Passo {step} de {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {/* Step 1: Nome */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Vamos começar!
            </h2>
            <p className="text-muted-foreground mb-8">
              Como você gostaria de ser chamado?
            </p>
            <div className="space-y-2">
              <Label htmlFor="nome">Seu nome</Label>
              <Input
                id="nome"
                placeholder="Digite seu nome"
                value={data.nome}
                onChange={(e) => updateData("nome", e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Objetivo e Experiência */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Seus objetivos
            </h2>
            <p className="text-muted-foreground mb-6">
              O que você quer alcançar com seus treinos?
            </p>

            <div className="space-y-3 mb-8">
              {OBJETIVOS.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => updateData("objetivo", obj.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                    data.objetivo === obj.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{obj.icon}</span>
                  <span className="font-medium">{obj.label}</span>
                </button>
              ))}
            </div>

            <Label className="mb-3 block">Nível de experiência</Label>
            <div className="space-y-3">
              {EXPERIENCIAS.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => updateData("experiencia", exp.id)}
                  className={cn(
                    "w-full flex flex-col items-start p-4 rounded-xl border-2 transition-all",
                    data.experiencia === exp.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="font-medium">{exp.label}</span>
                  <span className="text-sm text-muted-foreground">{exp.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Equipamentos */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Equipamentos disponíveis
            </h2>
            <p className="text-muted-foreground mb-6">
              Selecione tudo que você tem acesso na academia ou em casa.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {EQUIPAMENTOS.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => toggleArrayItem("equipamentos", eq.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    data.equipamentos.includes(eq.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={data.equipamentos.includes(eq.id)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm font-medium">{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Limitações */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Limitações físicas
            </h2>
            <p className="text-muted-foreground mb-6">
              Alguma dor ou lesão que devemos considerar?
            </p>

            <div className="space-y-3">
              {LIMITACOES.map((lim) => (
                <button
                  key={lim.id}
                  onClick={() => toggleArrayItem("limitacoes", lim.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                    data.limitacoes.includes(lim.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={data.limitacoes.includes(lim.id)}
                    className="pointer-events-none"
                  />
                  <span className="font-medium">{lim.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Disponibilidade */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Sua disponibilidade
            </h2>
            <p className="text-muted-foreground mb-8">
              Com que frequência você pode treinar?
            </p>

            <div className="space-y-8">
              <div>
                <Label className="mb-4 block">
                  Dias por semana: <span className="text-primary font-bold">{data.dias_semana}</span>
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      onClick={() => updateData("dias_semana", d)}
                      className={cn(
                        "flex-1 h-12 rounded-xl font-bold transition-all",
                        data.dias_semana === d
                          ? "gradient-primary text-primary-foreground"
                          : "bg-card border-2 border-border hover:border-primary/50"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tempo por treino: <span className="text-primary font-bold">{data.tempo_por_dia_min} min</span>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map((t) => (
                    <button
                      key={t}
                      onClick={() => updateData("tempo_por_dia_min", t)}
                      className={cn(
                        "h-12 rounded-xl font-medium transition-all",
                        data.tempo_por_dia_min === t
                          ? "gradient-primary text-primary-foreground"
                          : "bg-card border-2 border-border hover:border-primary/50"
                      )}
                    >
                      {t}min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep(step - 1)}
            className="flex-1"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>
        )}
        {step < totalSteps ? (
          <Button
            variant="gradient"
            size="lg"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button
            variant="gradient"
            size="lg"
            onClick={handleFinish}
            disabled={!canProceed() || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Criar meu plano
              </>
            )}
          </Button>
        )}
      </div>

      {/* Safety disclaimer */}
      <div className="px-6 pb-6">
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ As orientações são informativas e não substituem acompanhamento profissional.
        </p>
      </div>
    </div>
  );
}
