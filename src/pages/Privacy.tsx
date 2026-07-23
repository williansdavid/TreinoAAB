import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display font-bold">Política de Privacidade</h1>
      </header>

      <main className="px-6 pb-8 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="w-8 h-8 text-primary shrink-0" />
          <p className="text-sm">
            A Treino IA respeita sua privacidade e está em conformidade com a LGPD.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">1. Dados Coletados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Coletamos apenas os dados necessários para o funcionamento do app:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Email e senha (para autenticação)</li>
            <li>Nome (opcional, para personalização)</li>
            <li>Dados de treino (exercícios, cargas, repetições)</li>
            <li>Preferências e configurações do app</li>
            <li>Limitações físicas (para adaptação de exercícios)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">2. Uso dos Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seus dados são utilizados exclusivamente para:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li>Personalizar seu plano de treino</li>
            <li>Gerar sugestões de exercícios com IA</li>
            <li>Acompanhar seu progresso</li>
            <li>Sincronizar dados entre dispositivos</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">3. Compartilhamento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Não vendemos, alugamos ou compartilhamos</strong> seus dados pessoais 
            com terceiros para fins de marketing. Dados podem ser compartilhados apenas 
            com provedores de serviços essenciais (hospedagem, IA) sob contratos de 
            confidencialidade.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">4. Seus Direitos (LGPD)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você tem direito a:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
            <li><strong>Acesso:</strong> Ver todos os seus dados coletados</li>
            <li><strong>Correção:</strong> Corrigir dados incorretos</li>
            <li><strong>Exclusão:</strong> Solicitar remoção completa dos dados</li>
            <li><strong>Portabilidade:</strong> Exportar seus dados em formato aberto</li>
            <li><strong>Revogação:</strong> Cancelar consentimentos a qualquer momento</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">5. Segurança</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Utilizamos criptografia de ponta a ponta, senhas com hash seguro (bcrypt), 
            e isolamento de dados por usuário (Row Level Security) para proteger suas 
            informações.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">6. Contato</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
            acesse as configurações do app ou entre em contato através do suporte.
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
