import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Termos de Uso</h1>
      </header>

      <main className="px-6 pb-8 space-y-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-foreground">Aviso Importante</p>
            <p className="text-sm text-muted-foreground mt-1">
              As orientações fornecidas pelo Treino IA são <strong>informativas</strong> e 
              <strong> não substituem acompanhamento profissional</strong>. Interrompa 
              imediatamente em caso de dor e procure um especialista.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Aceitação dos Termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao utilizar o aplicativo Treino IA, você concorda com estes termos de uso. 
            Se não concordar, não utilize o aplicativo.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Natureza do Serviço</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Treino IA é uma <strong>ferramenta de apoio</strong> para planejamento e 
            registro de treinos de musculação. O app utiliza inteligência artificial 
            para gerar sugestões personalizadas, mas estas são orientações gerais e 
            não substituem a avaliação de um profissional de educação física ou médico.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Responsabilidades do Usuário</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
            <li>Fornecer informações verdadeiras sobre sua condição física</li>
            <li>Consultar um médico antes de iniciar qualquer programa de exercícios</li>
            <li>Respeitar seus limites físicos e sinais do corpo</li>
            <li>Interromper o exercício em caso de dor ou desconforto</li>
            <li>Manter suas credenciais de acesso em segurança</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Limitações de Responsabilidade</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Treino IA e seus desenvolvedores <strong>não se responsabilizam</strong> por:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Lesões decorrentes da execução incorreta de exercícios</li>
            <li>Danos causados por ignorar recomendações de segurança</li>
            <li>Resultados não alcançados</li>
            <li>Indisponibilidade temporária do serviço</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">5. Propriedade Intelectual</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todo o conteúdo do aplicativo, incluindo design, código, textos e imagens, 
            é protegido por direitos autorais. É proibida a reprodução não autorizada.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">6. Uso Adequado</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O usuário compromete-se a não utilizar o aplicativo para fins ilegais, 
            não tentar burlar sistemas de segurança, e não criar contas falsas.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">7. Alterações</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reservamo-nos o direito de alterar estes termos a qualquer momento. 
            Alterações significativas serão notificadas aos usuários.
          </p>
        </section>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Última atualização: Janeiro de 2024
          </p>
        </div>
      </main>
    </div>
  );
}
